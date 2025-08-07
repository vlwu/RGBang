export function formatKeyForDisplay(key) {
  if (key === ' ') return 'SPACE';
  if (key.startsWith('arrow')) return key.replace('arrow', '').toUpperCase();
  return key.toUpperCase();
}

export function formatTime(seconds = 0) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  const wholeSeconds = Math.floor(remainingSeconds);
  const milliseconds = Math.floor((remainingSeconds - wholeSeconds) * 1000);

  return `${minutes.toString().padStart(2, '0')}:${wholeSeconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
}