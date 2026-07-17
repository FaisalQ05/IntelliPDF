import { useNavigate } from "react-router-dom"

export default function Unauthorized() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md rounded-2xl border bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
          403
        </div>

        <h1 className="text-xl font-semibold text-gray-900">Access Denied</h1>

        <p className="mt-2 text-sm text-gray-600">
          You don’t have permission to view this page.
        </p>

        <div className="mt-6 flex gap-3">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex-1 rounded-lg bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-800"
          >
            Go Dashboard
          </button>

          <button
            onClick={() => navigate(-1)}
            className="flex-1 rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
          >
            Back
          </button>
        </div>
      </div>
    </div>
  )
}
