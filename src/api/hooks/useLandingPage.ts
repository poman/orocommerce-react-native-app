import { useEffect, useState } from 'react';
import { getLandingPageById, ILandingPage } from '../helpers/landingPages';
import { initializeApi, setAuthTokenGetter, setRefreshTokenFn } from '../api';

export interface IUseLandingPageResult {
  loading: boolean;
  error: string | null;
  landingPage: ILandingPage | null;
  refetch: () => void;
}

export function useLandingPage(
  id: string | null,
  baseUrl?: string,
  getValidAccessToken?: () => Promise<string | null>,
  refreshAccessToken?: () => Promise<boolean>
): IUseLandingPageResult {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [landingPage, setLandingPage] = useState<ILandingPage | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  useEffect(() => {
    let mounted = true;

    const fetchLandingPage = async () => {
      if (!baseUrl || !id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        initializeApi(baseUrl);
        if (getValidAccessToken) {
          setAuthTokenGetter(getValidAccessToken);
        }
        if (refreshAccessToken) {
          setRefreshTokenFn(refreshAccessToken);
        }

        const result = await getLandingPageById(id);

        if (!mounted) return;

        setLandingPage(result);
      } catch (e: any) {
        if (!mounted) return;

        setError(
          e?.response?.data?.errors?.[0]?.detail || e?.message || 'Failed to load landing page'
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchLandingPage();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseUrl, id, refetchTrigger]);

  const refetch = () => {
    setRefetchTrigger(prev => prev + 1);
  };

  return {
    loading,
    error,
    landingPage,
    refetch,
  };
}
