export default function Home() {
  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Patient Education App</h1>
      <ul className="list-disc pl-5">
        <li><a className="text-blue-600 underline" href="/login">Pharmacist Login</a></li>
        <li><a className="text-blue-600 underline" href="/dashboard">Dashboard</a></li>
        <li className="text-sm text-gray-600 mt-2">Public example: /p/revan-rx/67404000100000</li>
      </ul>
    </main>
  );
}
