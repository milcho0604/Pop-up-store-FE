'use client';

import { useState } from 'react';
import { healthApi, HealthCheckResponse } from '@/lib/api';

export default function Home() {
  const [health, setHealth] = useState<HealthCheckResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkHealth = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await healthApi.check();
      setHealth(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 에러');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
      <main className="flex flex-col items-center gap-8 p-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
          팝업스토어 서비스
        </h1>

        <div className="flex flex-col items-center gap-4 p-6 bg-white dark:bg-zinc-900 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-200">
            백엔드 연동 테스트
          </h2>

          <button
            onClick={checkHealth}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            {loading ? '확인 중...' : 'Health Check'}
          </button>

          {health && (
            <div className="mt-4 p-4 bg-green-100 dark:bg-green-900 rounded-lg">
              <p className="text-green-800 dark:text-green-200">
                <strong>Status:</strong> {health.status}
              </p>
              <p className="text-green-800 dark:text-green-200">
                <strong>Message:</strong> {health.message}
              </p>
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-100 dark:bg-red-900 rounded-lg">
              <p className="text-red-800 dark:text-red-200">
                <strong>Error:</strong> {error}
              </p>
              <p className="text-sm text-red-600 dark:text-red-300 mt-2">
                백엔드 서버가 실행 중인지 확인하세요 (localhost:8080)
              </p>
            </div>
          )}
        </div>

        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          API URL: {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}
        </p>
      </main>
    </div>
  );
}
