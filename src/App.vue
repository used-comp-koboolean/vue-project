<template>
  <div class="app-layout">
    <aside class="sidebar">
      <h2>Editors</h2>
      <nav>
        <RouterLink to="/quill" class="nav-link">Quill 화면</RouterLink>
        <RouterLink to="/tiptap" class="nav-link">TipTap 화면</RouterLink>
        <RouterLink to="/pdf-viewer" class="nav-link">PDF 뷰어 화면</RouterLink>
      </nav>
    </aside>

    <main class="content">
      <RouterView />
    </main>
  </div>
</template>

<style>
.app-layout {
  display: grid;
  grid-template-columns: 220px 1fr;
  min-height: 100vh;
}

.sidebar {
  border-right: 1px solid #d5dbe7;
  background: #f8fafc;
  padding: 18px 14px;
}

.sidebar h2 {
  margin: 0 0 12px;
  font-size: 15px;
  font-weight: 700;
}

.sidebar nav {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.nav-link {
  display: block;
  padding: 8px 10px;
  border-radius: 8px;
  color: #1f2937;
  text-decoration: none;
  font-weight: 500;
}

.nav-link:hover {
  background: #e8eefc;
}

.nav-link.router-link-active {
  background: #dbeafe;
  color: #1d4ed8;
}

.content {
  padding: 18px;
}

@media (max-width: 900px) {
  .app-layout {
    grid-template-columns: 1fr;
  }

  .sidebar {
    border-right: 0;
    border-bottom: 1px solid #d5dbe7;
  }
}
</style>
