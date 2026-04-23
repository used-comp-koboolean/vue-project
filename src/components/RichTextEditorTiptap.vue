<script setup>
import { ref, watch, onBeforeUnmount } from 'vue';
import { Editor, EditorContent } from '@tiptap/vue-3';
import { mergeAttributes } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle, Color, BackgroundColor, FontSize } from '@tiptap/extension-text-style';
import FontFamily from '@tiptap/extension-font-family';
import { Table, TableRow, TableCell, TableHeader } from '@tiptap/extension-table';
import { apiClient } from '@/plugins/axios.ts';

const props = defineProps({
  content: {
    type: [String, Object],
    default: '',
  },
  editorStyle: {
    type: [String, Object, Array],
    default: () => ({ height: '500px' }),
  },
});

const emit = defineEmits(['update:content']);

const FONT_OPTIONS = [
  { label: '노토 산스 KR', value: 'Noto Sans KR' },
  { label: '나눔고딕', value: 'Nanum Gothic' },
  { label: '나눔명조', value: 'Nanum Myeongjo' },
  { label: '나눔손글씨 펜', value: 'Nanum Pen Script' },
  { label: '푸어 스토리', value: 'Poor Story' },
  { label: '주아', value: 'Jua' },
];

const FONT_SIZE_OPTIONS = Array.from({ length: 21 }, (_, index) => {
  const size = `${index + 10}px`;
  return { label: size, value: size };
});

const fileInputRef = ref(null);

const TEXT_STYLE_PROPS = ['color', 'background-color', 'font-family', 'font-size', 'font-weight', 'font-style', 'text-decoration'];
const PRESERVE_STYLE_PROPS = [...TEXT_STYLE_PROPS, 'text-align'];
const URL_PATTERN = /((?:https?:\/\/|www\.)[^\s<>()]+(?:\([^\s<>()]*\)[^\s<>()]*)*)/gi;

function escapeHtml(value) {
  return (value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function textContainsUrl(value) {
  return /(?:https?:\/\/|www\.)[^\s<>()]+/i.test(value || '');
}

function splitTrailingPunctuation(value) {
  let core = value || '';
  let tail = '';

  while (/[),.;!?]$/.test(core)) {
    tail = core.slice(-1) + tail;
    core = core.slice(0, -1);
  }

  return { core, tail };
}

function normalizeUrl(url) {
  if (!url) return '';
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

function linkifyInlineText(text) {
  return escapeHtml(text).replace(URL_PATTERN, raw => {
    const { core, tail } = splitTrailingPunctuation(raw);
    if (!core) return raw;

    const href = normalizeUrl(core);
    return `<a href="${href}" target="_blank" rel="noopener noreferrer">${escapeHtml(core)}</a>${escapeHtml(tail)}`;
  });
}

function linkifyPlainTextToHtml(text) {
  const linked = linkifyInlineText(text || '');
  return linked.replace(/\r?\n/g, '<br>');
}

function linkifyHtmlDocument(doc) {
  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
  const textNodes = [];

  while (walker.nextNode()) {
    textNodes.push(walker.currentNode);
  }

  textNodes.forEach(node => {
    const value = node.nodeValue || '';
    if (!textContainsUrl(value)) return;

    const parent = node.parentElement;
    if (!parent) return;
    if (parent.closest('a,script,style')) return;

    const container = doc.createElement('span');
    container.innerHTML = linkifyInlineText(value);

    const fragment = doc.createDocumentFragment();
    while (container.firstChild) {
      fragment.appendChild(container.firstChild);
    }

    node.parentNode?.replaceChild(fragment, node);
  });
}

function applyDeclarationText(style, declarationText) {
  if (!declarationText) return;

  declarationText
    .split(';')
    .map(piece => piece.trim())
    .filter(Boolean)
    .forEach(piece => {
      const index = piece.indexOf(':');
      if (index === -1) return;

      const property = piece.slice(0, index).trim().toLowerCase();
      const value = piece.slice(index + 1).trim();

      if (!PRESERVE_STYLE_PROPS.includes(property) || !value) return;
      if (style.getPropertyValue(property)) return;

      style.setProperty(property, value);
    });
}

function applyCssRulesToInline(doc) {
  const styleTags = Array.from(doc.querySelectorAll('style'));
  if (!styleTags.length) return;

  const ruleRegex = /([^{}]+)\{([^}]+)\}/g;

  styleTags.forEach(tag => {
    const cssText = tag.textContent || '';
    let match = ruleRegex.exec(cssText);

    while (match) {
      const selectorText = match[1].trim();
      const declaration = match[2];

      if (!selectorText || selectorText.startsWith('@')) {
        match = ruleRegex.exec(cssText);
        continue;
      }

      selectorText
        .split(',')
        .map(selector => selector.trim())
        .filter(Boolean)
        .forEach(selector => {
          try {
            doc.body.querySelectorAll(selector).forEach(node => {
              applyDeclarationText(node.style, declaration);
            });
          } catch {
            // ignore invalid selectors in pasted content
          }
        });

      match = ruleRegex.exec(cssText);
    }
  });
}

function parseBackgroundColor(element) {
  const color = element.style?.backgroundColor || element.getAttribute('bgcolor') || '';
  return color || null;
}

function pickTextStyle(style) {
  const pieces = [];

  for (const prop of TEXT_STYLE_PROPS) {
    const value = style.getPropertyValue(prop);
    if (value) {
      pieces.push(`${prop}: ${value}`);
    }
  }

  return pieces.join('; ');
}

function removeTextStyleProps(style) {
  for (const prop of TEXT_STYLE_PROPS) {
    style.removeProperty(prop);
  }
}

function wrapChildrenWithInlineStyle(document, element, styleText) {
  if (!styleText || !element.firstChild) return;

  const wrapper = document.createElement('span');
  wrapper.setAttribute('style', styleText);

  while (element.firstChild) {
    wrapper.appendChild(element.firstChild);
  }

  element.appendChild(wrapper);
}

function isNodeEffectivelyEmpty(node) {
  if (!node) return true;

  if (node.nodeType === Node.TEXT_NODE) {
    return !(node.nodeValue || '').replace(/[\s\u00a0\u200b]/g, '');
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return true;
  }

  if (node.matches('img, video, iframe, table')) {
    return false;
  }

  const text = (node.textContent || '').replace(/[\s\u00a0\u200b]/g, '');
  if (text.length) return false;

  return !node.querySelector('img, video, iframe, table');
}

function isEmptyParagraphElement(node) {
  if (!node || node.tagName !== 'P') return false;

  const text = (node.textContent || '').replace(/[\s\u00a0\u200b]/g, '');
  if (text.length) return false;

  return !node.querySelector('img, video, iframe, table, svg, math');
}

function cleanupEmptyParagraphsInCells(doc) {
  const cells = doc.body.querySelectorAll('td, th');

  cells.forEach(cell => {
    const paragraphs = Array.from(cell.children).filter(child => child.tagName === 'P');
    if (!paragraphs.length) return;

    const hasNonEmptyParagraph = paragraphs.some(p => !isEmptyParagraphElement(p));
    if (!hasNonEmptyParagraph) return;

    paragraphs.forEach(p => {
      if (isEmptyParagraphElement(p)) {
        p.remove();
      }
    });
  });
}

function normalizeLeadingEmptyTitleCells(doc) {
  const rows = doc.body.querySelectorAll('tr');

  rows.forEach(row => {
    const cells = Array.from(row.children).filter(child => child.tagName === 'TD' || child.tagName === 'TH');
    if (cells.length < 2) return;

    const nonEmptyIndices = cells
      .map((cell, index) => (isNodeEffectivelyEmpty(cell) ? -1 : index))
      .filter(index => index >= 0);

    if (nonEmptyIndices.length !== 1) return;

    const contentIndex = nonEmptyIndices[0];
    if (contentIndex === 0) return;

    const contentCell = cells[contentIndex];
    const leadingCells = cells.slice(0, contentIndex);

    if (leadingCells.some(cell => !isNodeEffectivelyEmpty(cell))) return;
    if (leadingCells.some(cell => Number(cell.getAttribute('rowspan') || '1') > 1)) return;

    const addedColspan = leadingCells.reduce((sum, cell) => sum + Number(cell.getAttribute('colspan') || '1'), 0);
    const currentColspan = Number(contentCell.getAttribute('colspan') || '1');
    contentCell.setAttribute('colspan', String(currentColspan + addedColspan));

    leadingCells.forEach(cell => row.removeChild(cell));
  });
}

function removeEmptyParagraphNodes(doc) {
  const paragraphs = doc.body.querySelectorAll('p');

  paragraphs.forEach(p => {
    if (isEmptyParagraphElement(p)) {
      p.remove();
    }
  });
}

function removeInterBlockWhitespaceTextNodes(doc) {
  const blockParents = new Set(['BODY', 'TABLE', 'TBODY', 'THEAD', 'TFOOT', 'TR']);
  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
  const textNodes = [];

  while (walker.nextNode()) {
    textNodes.push(walker.currentNode);
  }

  textNodes.forEach(node => {
    const parent = node.parentElement;
    if (!parent || !blockParents.has(parent.tagName)) return;

    const value = node.nodeValue || '';
    if (!/^[\s\u00a0\u200b]+$/.test(value)) return;

    node.parentNode?.removeChild(node);
  });
}

function cleanupWhitespaceOnlyBlocks(doc) {
  const blocks = doc.body.querySelectorAll('p, div, li');

  blocks.forEach(block => {
    if (block.closest('td, th') && block.parentElement?.children.length === 1) return;

    const text = (block.textContent || '').replace(/[\s\u00a0\u200b]/g, '');
    const hasContentNode = !!block.querySelector('img, video, iframe, table, br');

    if (!text && !hasContentNode) {
      block.remove();
    }
  });
}

function normalizePastedHtml(html) {
  if (!html) return html;

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  if (!doc?.body) return html;

  applyCssRulesToInline(doc);

  const normalizeAlign = value => {
    const normalized = (value || '').toLowerCase().trim();
    if (normalized === 'left' || normalized === 'center' || normalized === 'right' || normalized === 'justify') {
      return normalized;
    }
    return '';
  };

  doc.body.querySelectorAll('[align]').forEach(node => {
    const alignment = normalizeAlign(node.getAttribute('align'));
    if (!alignment) return;

    if (!node.style.textAlign) {
      node.style.textAlign = alignment;
    }
  });

  doc.body.querySelectorAll('tr').forEach(row => {
    const rowAlign = normalizeAlign(row.style.textAlign || row.getAttribute('align'));
    if (!rowAlign) return;

    row.querySelectorAll('td, th').forEach(cell => {
      if (!cell.style.textAlign) {
        cell.style.textAlign = rowAlign;
      }
    });
  });

  doc.body.querySelectorAll('script, style, meta, link, o\\:p').forEach(node => node.remove());

  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  while (walker.nextNode()) {
    textNodes.push(walker.currentNode);
  }

  textNodes.forEach(node => {
    if (!node.nodeValue) return;
    node.nodeValue = node.nodeValue.replaceAll('\u200b', '');
  });

  const selectors = ['td', 'th'];
  const nodes = doc.body.querySelectorAll(selectors.join(','));

  nodes.forEach(node => {
    const styleText = pickTextStyle(node.style);
    if (!styleText) return;

    const hasStyledSpan = !!node.querySelector('span[style]');
    if (hasStyledSpan) return;

    wrapChildrenWithInlineStyle(doc, node, styleText);
    removeTextStyleProps(node.style);
  });

  const rows = doc.body.querySelectorAll('tr');
  rows.forEach(row => {
    const children = Array.from(row.childNodes);

    children.forEach(child => {
      if (child.nodeType === Node.TEXT_NODE && !child.textContent?.trim()) {
        row.removeChild(child);
        return;
      }

      if (child.nodeType === Node.COMMENT_NODE) {
        row.removeChild(child);
        return;
      }

      if (child.nodeType === Node.ELEMENT_NODE) {
        const tagName = child.tagName;
        if (tagName !== 'TD' && tagName !== 'TH') {
          row.removeChild(child);
        }
      }
    });
  });

  const emptyBlocks = doc.body.querySelectorAll('p, div, li');
  emptyBlocks.forEach(node => {
    if (node.closest('td, th')) return;

    const hasMedia = node.querySelector('img, table, video, iframe');
    if (hasMedia) return;

    const normalized = (node.textContent || '').replace(/[\s\u00a0\u200b]/g, '');
    if (normalized.length === 0 && !node.querySelector('br')) {
      node.remove();
    }
  });

  cleanupEmptyParagraphsInCells(doc);
  normalizeLeadingEmptyTitleCells(doc);
  cleanupWhitespaceOnlyBlocks(doc);
  removeEmptyParagraphNodes(doc);
  removeInterBlockWhitespaceTextNodes(doc);

  return doc.body.innerHTML;
}

function cleanPastedHtmlLight(html) {
  if (!html) return html;

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  if (!doc?.body) return html;

  const isWhitespaceOnly = value => /^[\s\u00a0\u200b]*$/.test(value || '');

  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  while (walker.nextNode()) {
    textNodes.push(walker.currentNode);
  }

  textNodes.forEach(node => {
    const parent = node.parentElement;
    const isBlockParent = parent && ['BODY', 'TABLE', 'TBODY', 'THEAD', 'TFOOT', 'TR'].includes(parent.tagName);

    if (isBlockParent && isWhitespaceOnly(node.nodeValue)) {
      node.remove();
      return;
    }

    node.nodeValue = (node.nodeValue || '').replaceAll('\u200b', '');
  });

  doc.body.querySelectorAll('p, div').forEach(node => {
    if (node.querySelector('img, video, iframe, table, br')) return;

    if (isWhitespaceOnly(node.textContent)) {
      node.remove();
    }
  });

  cleanupEmptyParagraphsInCells(doc);
  removeEmptyParagraphNodes(doc);
  normalizeLeadingEmptyTitleCells(doc);
  linkifyHtmlDocument(doc);

  doc.body.querySelectorAll('a[href]').forEach(anchor => {
    anchor.setAttribute('target', '_blank');
    anchor.setAttribute('rel', 'noopener noreferrer');
  });

  return doc.body.innerHTML;
}

const CustomTableCell = TableCell.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      backgroundColor: {
        default: null,
        parseHTML: parseBackgroundColor,
        renderHTML: attributes => {
          if (!attributes.backgroundColor) return {};
          return { style: `background-color: ${attributes.backgroundColor}` };
        },
      },
    };
  },
});

const CustomTableHeader = TableHeader.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      backgroundColor: {
        default: null,
        parseHTML: parseBackgroundColor,
        renderHTML: attributes => {
          if (!attributes.backgroundColor) return {};
          return { style: `background-color: ${attributes.backgroundColor}` };
        },
      },
    };
  },
});

const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: element => {
          const width = element.getAttribute('width') || element.style.width || '';
          return width.replace('px', '') || null;
        },
        renderHTML: attributes => {
          if (!attributes.width) {
            return { style: 'max-width: 100%; height: auto;' };
          }

          return {
            width: attributes.width,
            style: `width: ${attributes.width}px; max-width: 100%; height: auto;`,
          };
        },
      },
    };
  },
  renderHTML({ HTMLAttributes }) {
    return ['img', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)];
  },
});

function getInitialContent() {
  return typeof props.content === 'string' ? props.content : '';
}

async function uploadImage(file) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await apiClient.post('/api/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return res.data?.urls?.[0] || '';
}

const editor = new Editor({
  content: getInitialContent(),
  extensions: [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
      link: false,
      underline: false,
    }),
    Underline,
    Link.configure({
      openOnClick: false,
      autolink: true,
      defaultProtocol: 'https',
      HTMLAttributes: {
        target: '_blank',
        rel: 'noopener noreferrer',
      },
    }),
    TextAlign.configure({
      types: ['heading', 'paragraph', 'tableCell', 'tableHeader'],
    }),
    TextStyle,
    Color.configure({ types: ['textStyle'] }),
    BackgroundColor.configure({ types: ['textStyle'] }),
    FontSize.configure({ types: ['textStyle'] }),
    FontFamily.configure({ types: ['textStyle'] }),
    ResizableImage,
    Table.configure({
      resizable: true,
      lastColumnResizable: true,
      allowTableNodeSelection: true,
    }),
    TableRow,
    CustomTableHeader,
    CustomTableCell,
  ],
  editorProps: {
    attributes: {
      class: 'tiptap-editor',
    },
    handlePaste(view, event) {
      const html = event.clipboardData?.getData('text/html') || '';
      const plainText = event.clipboardData?.getData('text/plain') || '';
      const items = Array.from(event.clipboardData?.items || []);
      const files = items
        .filter(item => item.type.startsWith('image/'))
        .map(item => item.getAsFile())
        .filter(Boolean);

      if (!html && textContainsUrl(plainText)) {
        event.preventDefault();

        editor.commands.insertContent(linkifyPlainTextToHtml(plainText), {
          parseOptions: {
            preserveWhitespace: true,
          },
        });

        return true;
      }

      if (html) {
        event.preventDefault();
        editor.commands.insertContent(cleanPastedHtmlLight(html), {
          parseOptions: {
            preserveWhitespace: true,
          },
        });
        return true;
      }

      if (!files.length) return false;

      event.preventDefault();

      (async () => {
        for (const file of files) {
          const url = await uploadImage(file);
          if (url) {
            editor.chain().focus().setImage({ src: url }).run();
          }
        }
      })();

      return true;
    },
  },
  onUpdate: ({ editor: currentEditor }) => {
    emit('update:content', currentEditor.getHTML());
  },
});

watch(
  () => props.content,
  value => {
    if (!editor) return;

    const next = typeof value === 'string' ? value : '';
    if (next !== editor.getHTML()) {
      editor.commands.setContent(next, { emitUpdate: false });
    }
  },
);

function setFontFamily(event) {
  const value = event.target.value;

  if (!value) {
    editor.chain().focus().unsetFontFamily().run();
    return;
  }

  editor.chain().focus().setFontFamily(value).run();
}

function setFontSize(event) {
  const value = event.target.value;

  if (!value) {
    editor.chain().focus().unsetFontSize().run();
    return;
  }

  editor.chain().focus().setFontSize(value).run();
}

function getCurrentFont() {
  return editor.getAttributes('textStyle').fontFamily || '';
}

function getCurrentFontSize() {
  return editor.getAttributes('textStyle').fontSize || '';
}

function setLink() {
  const previous = editor.getAttributes('link').href || '';
  const href = window.prompt('링크 주소를 입력하세요', previous);

  if (href === null) return;

  if (!href) {
    editor.chain().focus().unsetLink().run();
    return;
  }

  editor.chain().focus().setLink({ href }).run();
}

function triggerImageUpload() {
  fileInputRef.value?.click?.();
}

async function handleImageInputChange(event) {
  const files = Array.from(event.target.files || []);

  for (const file of files) {
    const url = await uploadImage(file);

    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }

  event.target.value = '';
}

function updateImageWidth(delta) {
  const node = editor.state.selection.node;
  if (!node || node.type.name !== 'image') return;

  const current = Number(node.attrs.width || 400);
  const next = Math.max(80, Math.min(1200, current + delta));

  editor.chain().focus().updateAttributes('image', { width: String(next) }).run();
}

function resetImageWidth() {
  const node = editor.state.selection.node;
  if (!node || node.type.name !== 'image') return;

  editor.chain().focus().updateAttributes('image', { width: null }).run();
}

function getHTML() {
  return editor?.getHTML?.() || '';
}

function getEditor() {
  return editor || null;
}

defineExpose({
  getHTML,
  getEditor,
});

onBeforeUnmount(() => {
  editor?.destroy?.();
});
</script>

<template>
  <div class="tiptap-wrap">
    <div class="toolbar" role="toolbar" aria-label="Editor toolbar">
      <div class="toolbar-group toolbar-group-font" title="글꼴">
        <select :value="getCurrentFont()" @change="setFontFamily">
          <option value="">기본 글꼴</option>
          <option v-for="font in FONT_OPTIONS" :key="font.value" :value="font.value">
            {{ font.label }}
          </option>
        </select>
        <select :value="getCurrentFontSize()" @change="setFontSize" title="글자 크기">
          <option value="">기본 크기</option>
          <option v-for="size in FONT_SIZE_OPTIONS" :key="size.value" :value="size.value">
            {{ size.label }}
          </option>
        </select>
      </div>

      <div class="toolbar-group">
        <button
          type="button"
          class="tool-btn"
          :class="{ active: editor.isActive('bold') }"
          title="굵게"
          @click="editor.chain().focus().toggleBold().run()"
        >
          B
        </button>
        <button
          type="button"
          class="tool-btn"
          :class="{ active: editor.isActive('italic') }"
          title="기울임"
          @click="editor.chain().focus().toggleItalic().run()"
        >
          I
        </button>
        <button
          type="button"
          class="tool-btn"
          :class="{ active: editor.isActive('underline') }"
          title="밑줄"
          @click="editor.chain().focus().toggleUnderline().run()"
        >
          U
        </button>
        <button
          type="button"
          class="tool-btn"
          :class="{ active: editor.isActive('heading', { level: 1 }) }"
          title="제목 1"
          @click="editor.chain().focus().toggleHeading({ level: 1 }).run()"
        >
          H1
        </button>
        <button
          type="button"
          class="tool-btn"
          :class="{ active: editor.isActive('heading', { level: 2 }) }"
          title="제목 2"
          @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
        >
          H2
        </button>
      </div>

      <div class="toolbar-group">
        <button
          type="button"
          class="tool-btn"
          :class="{ active: editor.isActive('bulletList') }"
          title="글머리 목록"
          @click="editor.chain().focus().toggleBulletList().run()"
        >
          •
        </button>
        <button
          type="button"
          class="tool-btn"
          :class="{ active: editor.isActive('orderedList') }"
          title="번호 목록"
          @click="editor.chain().focus().toggleOrderedList().run()"
        >
          1.
        </button>
        <button
          type="button"
          class="tool-btn"
          :class="{ active: editor.isActive({ textAlign: 'left' }) }"
          title="왼쪽 정렬"
          @click="editor.chain().focus().setTextAlign('left').run()"
        >
          좌
        </button>
        <button
          type="button"
          class="tool-btn"
          :class="{ active: editor.isActive({ textAlign: 'center' }) }"
          title="가운데 정렬"
          @click="editor.chain().focus().setTextAlign('center').run()"
        >
          중
        </button>
        <button
          type="button"
          class="tool-btn"
          :class="{ active: editor.isActive({ textAlign: 'right' }) }"
          title="오른쪽 정렬"
          @click="editor.chain().focus().setTextAlign('right').run()"
        >
          우
        </button>
      </div>

      <div class="toolbar-group">
        <button type="button" class="tool-btn tool-btn-wide" title="링크" @click="setLink">링크</button>
        <button type="button" class="tool-btn tool-btn-wide" title="이미지 업로드" @click="triggerImageUpload">이미지</button>
        <button type="button" class="tool-btn" title="이미지 축소" @click="updateImageWidth(-50)">-</button>
        <button type="button" class="tool-btn" title="이미지 확대" @click="updateImageWidth(50)">+</button>
        <button type="button" class="tool-btn tool-btn-wide" title="이미지 원본" @click="resetImageWidth">원본</button>
      </div>

      <div class="toolbar-group">
        <button type="button" class="tool-btn tool-btn-wide" title="표 추가" @click="editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()">표+</button>
        <button type="button" class="tool-btn" title="열 앞 삽입" @click="editor.chain().focus().addColumnBefore().run()">열←</button>
        <button type="button" class="tool-btn" title="열 뒤 삽입" @click="editor.chain().focus().addColumnAfter().run()">열→</button>
        <button type="button" class="tool-btn" title="열 삭제" @click="editor.chain().focus().deleteColumn().run()">열X</button>
        <button type="button" class="tool-btn" title="행 위 삽입" @click="editor.chain().focus().addRowBefore().run()">행↑</button>
        <button type="button" class="tool-btn" title="행 아래 삽입" @click="editor.chain().focus().addRowAfter().run()">행↓</button>
        <button type="button" class="tool-btn" title="행 삭제" @click="editor.chain().focus().deleteRow().run()">행X</button>
        <button type="button" class="tool-btn" title="셀 병합" @click="editor.chain().focus().mergeCells().run()">병합</button>
        <button type="button" class="tool-btn" title="셀 분할" @click="editor.chain().focus().splitCell().run()">분할</button>
        <button type="button" class="tool-btn" title="헤더 행 토글" @click="editor.chain().focus().toggleHeaderRow().run()">H행</button>
        <button type="button" class="tool-btn" title="헤더 열 토글" @click="editor.chain().focus().toggleHeaderColumn().run()">H열</button>
        <button type="button" class="tool-btn" title="표 삭제" @click="editor.chain().focus().deleteTable().run()">표X</button>
      </div>

      <div class="toolbar-group">
        <button type="button" class="tool-btn tool-btn-wide" title="서식 초기화" @click="editor.chain().focus().unsetAllMarks().clearNodes().run()">초기화</button>
      </div>
    </div>

    <EditorContent :editor="editor" class="editor-content" :style="props.editorStyle" />

    <input ref="fileInputRef" type="file" accept="image/*" multiple hidden @change="handleImageInputChange" />
  </div>
</template>

<style>
.tiptap-wrap {
  width: 100%;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 0;
  align-items: center;
  padding: 10px;
  border: 1px solid #cfd6e2;
  border-bottom: 0;
  border-radius: 8px 8px 0 0;
  background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
}

.toolbar-group {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px;
  border: 1px solid #d7deea;
  border-radius: 8px;
  background: #ffffff;
}

.toolbar-group-font {
  padding: 4px 6px;
}

.toolbar select,
.toolbar button {
  height: 30px;
  padding: 0 8px;
  border: 1px solid #d0d5dd;
  background: #fff;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
}

.toolbar button {
  min-width: 30px;
  font-weight: 600;
}

.toolbar select {
  min-width: 140px;
}

.toolbar-group-font select:last-child {
  min-width: 96px;
}

.tool-btn-wide {
  min-width: 46px;
}

.toolbar button:hover,
.toolbar select:hover {
  background: #f1f5ff;
  border-color: #9fb0cd;
}

.toolbar button:active {
  background: #e3ebff;
}

.toolbar button.active {
  background: #2563eb;
  border-color: #1d4ed8;
  color: #ffffff;
}

.toolbar button:focus-visible,
.toolbar select:focus-visible {
  outline: 2px solid #93c5fd;
  outline-offset: 1px;
}

.editor-content {
  border: 1px solid #d0d5dd;
  border-radius: 0 0 8px 8px;
  overflow: hidden;
}

.tiptap-editor {
  height: 100%;
  min-height: 220px;
  overflow-y: auto;
  padding: 16px;
  line-height: 1.75;
  font-size: 15px;
  white-space: pre-wrap;
  word-break: keep-all;
}

.tiptap-editor:focus {
  outline: none;
}

.tiptap-editor img {
  max-width: 100%;
  height: auto;
}

.tiptap-editor p {
  margin: 0.15em 0;
  white-space: inherit;
}

.tiptap-editor td p,
.tiptap-editor th p {
  margin: 0.15em 0;
  white-space: inherit;
}

.tiptap-editor p:empty::before {
  content: '\00a0';
}

.tiptap-editor table {
  border-collapse: collapse;
  table-layout: fixed;
  width: 100%;
  margin: 12px 0;
}

.tiptap-editor .tableWrapper {
  overflow-x: auto;
}

.tiptap-editor .tableWrapper table {
  margin: 0;
}

.tiptap-editor .column-resize-handle {
  position: absolute;
  top: 0;
  right: -2px;
  bottom: -2px;
  width: 4px;
  background-color: #60a5fa;
  pointer-events: none;
}

.resize-cursor {
  cursor: col-resize;
}

.tiptap-editor .selectedCell::after {
  z-index: 1;
}

.tiptap-editor .ProseMirror-selectednode table {
  outline: 2px solid #60a5fa;
  outline-offset: 2px;
}

.tiptap-editor th,
.tiptap-editor td {
  border: 1px solid #b9c1d0;
  padding: 8px;
  vertical-align: top;
}

.tiptap-editor th {
  background: #f2f5fa;
  font-weight: 600;
}

.tiptap-editor .selectedCell {
  background: #e8f2ff;
}
</style>
