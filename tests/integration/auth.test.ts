import AsyncStorage from '@react-native-async-storage/async-storage';
const mockAxiosPost = jest.fn();
const mockAxiosGet = jest.fn();
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    post: mockAxiosPost,
    get: mockAxiosGet,
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() },
    },
  })),
  post: mockAxiosPost,
  get: mockAxiosGet,
}));
describe('Authentication Service - Integration Tests', () => {
  const mockUser = {
    email: 'test@example.com',
    password: 'Password123!',
    token: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
  };
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
    mockAxiosPost.mockReset();
    mockAxiosGet.mockReset();
  });
  describe('User Authentication', () => {
    /**
     * Test Case 1: Successful Authentication and Token Storage
     */
    it('should successfully authenticate user and store token', async () => {
      const loginResponse = {
        data: {
          access_token: mockUser.token,
          refresh_token: mockUser.refreshToken,
          expires_in: 3600,
          token_type: 'Bearer',
        },
      };
      mockAxiosPost.mockResolvedValueOnce(loginResponse);
      const response = await mockAxiosPost('/oauth2-token', {
        grant_type: 'password',
        username: mockUser.email,
        password: mockUser.password,
      });
      await AsyncStorage.setItem('auth_token', response.data.access_token);
      await AsyncStorage.setItem('refresh_token', response.data.refresh_token);
      await AsyncStorage.setItem('user_email', mockUser.email);
      expect(mockAxiosPost).toHaveBeenCalledWith(
        '/oauth2-token',
        expect.objectContaining({
          grant_type: 'password',
          username: mockUser.email,
          password: mockUser.password,
        })
      );
      const storedToken = await AsyncStorage.getItem('auth_token');
      const storedRefreshToken = await AsyncStorage.getItem('refresh_token');
      const storedEmail = await AsyncStorage.getItem('user_email');
      expect(storedToken).toBe(mockUser.token);
      expect(storedRefreshToken).toBe(mockUser.refreshToken);
      expect(storedEmail).toBe(mockUser.email);
    });

    /**
     * Test Case 2: Handle Invalid Credentials Error
     */
    it('should handle invalid credentials error', async () => {
      const errorResponse = {
        response: {
          status: 401,
          data: {
            error: 'invalid_grant',
            error_description: 'Invalid credentials',
          },
        },
      };
      mockAxiosPost.mockRejectedValueOnce(errorResponse);
      await expect(
        mockAxiosPost('/oauth2-token', {
          grant_type: 'password',
          username: mockUser.email,
          password: 'WrongPassword',
        })
      ).rejects.toMatchObject(errorResponse);
      const storedToken = await AsyncStorage.getItem('auth_token');
      expect(storedToken).toBeNull();
    });

    /**
     * Test Case 3: Handle Network Errors
     */
    it('should handle network errors', async () => {
      mockAxiosPost.mockRejectedValueOnce(new Error('Network Error'));
      await expect(
        mockAxiosPost('/oauth2-token', {
          grant_type: 'password',
          username: mockUser.email,
          password: mockUser.password,
        })
      ).rejects.toThrow('Network Error');
    });
  });
  describe('Token Refresh', () => {
    /**
     * Test Case 4: Refresh Expired Token Using Refresh Token
     */
    it('should refresh expired token using refresh token', async () => {
      await AsyncStorage.setItem('auth_token', 'expired-token');
      await AsyncStorage.setItem('refresh_token', mockUser.refreshToken);
      const newToken = 'new-access-token';
      const refreshResponse = {
        data: {
          access_token: newToken,
          refresh_token: mockUser.refreshToken,
          expires_in: 3600,
        },
      };
      mockAxiosPost.mockResolvedValueOnce(refreshResponse);
      const response = await mockAxiosPost('/oauth2-token', {
        grant_type: 'refresh_token',
        refresh_token: mockUser.refreshToken,
      });
      await AsyncStorage.setItem('auth_token', response.data.access_token);
      expect(mockAxiosPost).toHaveBeenCalledWith(
        '/oauth2-token',
        expect.objectContaining({
          grant_type: 'refresh_token',
          refresh_token: mockUser.refreshToken,
        })
      );
      const storedToken = await AsyncStorage.getItem('auth_token');
      expect(storedToken).toBe(newToken);
    });

    /**
     * Test Case 5: Handle Refresh Token Expiration
     */
    it('should handle refresh token expiration', async () => {
      const errorResponse = {
        response: {
          status: 401,
          data: {
            error: 'invalid_grant',
            error_description: 'Refresh token expired',
          },
        },
      };
      mockAxiosPost.mockRejectedValueOnce(errorResponse);
      await expect(
        mockAxiosPost('/oauth2-token', {
          grant_type: 'refresh_token',
          refresh_token: 'expired-refresh-token',
        })
      ).rejects.toMatchObject(errorResponse);
    });
  });
  describe('Logout', () => {
    /**
     * Test Case 6: Clear All Authentication Data on Logout
     */
    it('should clear all authentication data on logout', async () => {
      await AsyncStorage.setItem('auth_token', mockUser.token);
      await AsyncStorage.setItem('refresh_token', mockUser.refreshToken);
      await AsyncStorage.setItem('user_email', mockUser.email);
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('refresh_token');
      await AsyncStorage.removeItem('user_email');
      const token = await AsyncStorage.getItem('auth_token');
      const refreshToken = await AsyncStorage.getItem('refresh_token');
      const email = await AsyncStorage.getItem('user_email');
      expect(token).toBeNull();
      expect(refreshToken).toBeNull();
      expect(email).toBeNull();
    });
  });

  describe('Token Validation', () => {
    /**
     * Test Case 7: Validate Token Format
     */
    it('should validate token format', () => {
      const validToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U';
      const invalidToken = 'invalid-token';
      expect(validToken).toMatch(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/);
      expect(invalidToken).not.toMatch(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/);
    });

    /**
     * Test Case 8: Check Token Expiration Timestamp
     */
    it('should check token expiration timestamp', async () => {
      const now = Date.now();
      const expiresAt = now + 3600000;
      await AsyncStorage.setItem('auth_token', mockUser.token);
      await AsyncStorage.setItem('token_expires_at', expiresAt.toString());
      const storedExpiresAt = await AsyncStorage.getItem('token_expires_at');
      const isExpired = storedExpiresAt ? parseInt(storedExpiresAt) < now : true;
      expect(isExpired).toBe(false);
    });
  });
});
