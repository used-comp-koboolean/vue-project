export const DUMMY_DB_EVENTS = [
  {
    id: 'test1-1',
    title: 'TEST1-1',
    start: '20260501',
    end: '20260510',
    allDay: true,
    backgroundColor: '#1e88e59f',
    borderColor: '#1e88e59f',
    textColor: '#ffffff'
  },
  {
    id: 'test1-2',
    title: 'TEST1-2',
    start: '20260512',
    end: '20260520',
    allDay: true,
    backgroundColor: '#1e88e59f',
    borderColor: '#1e88e59f',
    textColor: '#ffffff'
  },
  {
    id: 'test1-3',
    title: 'TEST1-3',
    start: '20260522',
    end: '20260531',
    allDay: true,
    backgroundColor: '#1e88e59f',
    borderColor: '#1e88e59f',
    textColor: '#ffffff'
  },
  {
    id: 'test2-1',
    title: 'TEST2-1',
    start: '20260507',
    end: '20260509',
    allDay: true,
    backgroundColor: '#43a0479f',
    borderColor: '#43a0479f',
    textColor: '#ffffff'
  },
  {
    id: 'test2-2',
    title: 'TEST2-2',
    start: '20260515',
    end: '20260518',
    allDay: true,
    backgroundColor: '#43a0479f',
    borderColor: '#43a0479f',
    textColor: '#ffffff'
  },
  {
    id: 'test3-1',
    title: 'TEST3-1',
    start: '20260510',
    end: '20260513',
    allDay: true,
    backgroundColor: '#fb8c009f',
    borderColor: '#fb8c009f',
    textColor: '#ffffff'
  }
]

export const fetchDummyDbEvents = () => {
  return Promise.resolve([...DUMMY_DB_EVENTS])
}
