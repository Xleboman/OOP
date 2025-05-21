export interface Record {
  mode: number;
  score: number;
  time: number;
  date?: number;
}

const RECORDS_KEY = 'tetris_records';
const MAX_RECORDS_PER_MODE = 10;

export const getRecords = (mode?: number): Record[] => {
  const recordsJson = localStorage.getItem(RECORDS_KEY);
  const allRecords: Record[] = recordsJson ? JSON.parse(recordsJson) : [];
  
  if (mode !== undefined) {
    return allRecords
      .filter(r => r.mode === mode)
      .sort((a, b) => b.score - a.score || b.time - a.time || (b.date || 0) - (a.date || 0))
      .slice(0, MAX_RECORDS_PER_MODE);
  }
  
  return allRecords;
};

export const saveRecord = (record: Record): void => {
  // Не сохраняем нулевые результаты
  if (record.score <= 0) return;
  
  const records = getRecords();
  const newRecord = {
    ...record,
    date: Date.now()
  };
  
  // Добавляем новый рекорд
  records.push(newRecord);
  
  // Группируем по режимам
  const recordsByMode: {[key: number]: Record[]} = records.reduce((acc, r) => {
    if (!acc[r.mode]) acc[r.mode] = [];
    acc[r.mode].push(r);
    return acc;
  }, {} as {[key: number]: Record[]});
  
  // Сортируем и обрезаем каждый режим
  const updatedRecords = Object.values(recordsByMode)
    .flatMap(modeRecords => 
      modeRecords
        .sort((a, b) => b.score - a.score || b.time - a.time || (b.date || 0) - (a.date || 0))
        .slice(0, MAX_RECORDS_PER_MODE)
    );
  
  localStorage.setItem(RECORDS_KEY, JSON.stringify(updatedRecords));
};