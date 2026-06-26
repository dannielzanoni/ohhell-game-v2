import tableBackground from '@/assets/back.png';

export function Game() {
  return (
    <main
      aria-label="Oh Hell game table"
      className="min-h-screen bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${tableBackground})` }}
    />
  );
}
