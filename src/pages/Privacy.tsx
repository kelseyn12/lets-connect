export default function Privacy() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-blue-50 to-green-100 px-6 py-12 text-gray-700">
      <div className="max-w-xl bg-white/70 backdrop-blur-md rounded-2xl shadow-lg p-8 text-center">
        <h1 className="text-3xl font-semibold text-gray-800 mb-4">Privacy Policy</h1>
        <p className="mb-4">
          <strong>Let’s Connect</strong> is a simple, anonymous chat experiment built by{" "}
          <span className="font-medium">Kelsey Nocek</span>.
        </p>
        <p className="mb-4">
          No personal data, email, or identity information is collected or stored. Each user
          is signed in anonymously through Firebase.
        </p>
        <p className="mb-4">
          Chats are temporary and only visible to the two people matched by the same word.
          When a chat ends, messages are no longer accessible.
        </p>
        <p className="mb-4">
          This project does not use cookies, analytics, or trackers of any kind. It’s simply
          meant to spark connection — nothing more.
        </p>
        <p className="mt-8 text-gray-500 text-sm">
          Last updated: October 2025
        </p>
        <a
          href="/"
          className="inline-block mt-6 text-blue-600 hover:underline font-medium"
        >
          ← Back to Let's Connect
        </a>
      </div>
    </div>
  );
}
