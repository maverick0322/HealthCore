export const useLogin = () => {
  const navigate = useNavigate();
  const { t } = useTranslation('auth');
  const login = useAuthStore((s) => s.login);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const logout = useAuthStore((s) => s.logout);

  const handleLogin = async (data: LoginRequest, expectedRole?: string) => {
    setError(null);
    setIsLoading(true);
    try {
      await login(data);

      const currentUser = useAuthStore.getState().user;

      if (expectedRole) {
        // Admins can log in regardless of the selected UI toggle
        if (
          currentUser &&
          currentUser.role !== 'ADMIN' &&
          currentUser.role !== expectedRole
        ) {
          await logout();
          setError(t('errorInvalidCredentials'));
          return;
        }
      }

      // Redirect to role dashboard. PatientOnboardingGuard will enforce onboarding.
      if (currentUser?.role === 'PATIENT') {
        navigate('/dashboard/patient', { replace: true });
      } else if (currentUser?.role === 'NUTRITIONIST') {
        navigate('/dashboard/nutritionist', { replace: true });
      } else if (currentUser?.role === 'ADMIN') {
        navigate('/dashboard/admin', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (err: unknown) {
      console.error('[useLogin] Login failed:', err);
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        if (status === 401) {
          setError(t('errorInvalidCredentials'));
        } else if (status === 400) {
          setError(t('errorValidation'));
        } else if (status === 403) {
          setError(t('errorForbidden'));
        } else {
          setError(t('errorUnexpected'));
        }
      } else {
        setError(t('errorUnexpected'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return { handleLogin, isLoading, error };
};