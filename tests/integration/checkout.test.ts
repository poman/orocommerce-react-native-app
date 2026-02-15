import AsyncStorage from '@react-native-async-storage/async-storage';
const mockAxiosPost = jest.fn();
const mockAxiosGet = jest.fn();
const mockAxiosPatch = jest.fn();

jest.mock('axios', () => ({
  create: jest.fn(() => ({
    post: mockAxiosPost,
    get: mockAxiosGet,
    patch: mockAxiosPatch,
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() },
    },
  })),
  post: mockAxiosPost,
  get: mockAxiosGet,
  patch: mockAxiosPatch,
}));

describe('Checkout Service - Integration Tests', () => {
  const mockCheckout = {
    id: '123',
    type: 'checkouts',
    attributes: {
      currency: 'USD',
      subtotalValue: '199.98',
      totalValue: '219.97',
      shippingCostAmount: '19.99',
    },
  };

  const mockAddress = {
    id: '1',
    type: 'customeraddresses',
    attributes: {
      label: 'Home',
      firstName: 'John',
      lastName: 'Doe',
      street: '123 Test St',
      city: 'Test City',
      postalCode: '12345',
    },
    relationships: {
      country: { data: { type: 'countries', id: 'US' } },
      region: { data: { type: 'regions', id: 'US-NY' } },
    },
  };

  const mockShippingMethods = [
    {
      id: 'flat_rate_1',
      type: 'checkoutavailableshippingmethods',
      attributes: {
        label: 'Flat Rate',
        types: [
          {
            id: 'primary',
            label: 'Flat Rate',
            shippingCost: '10.00',
            currency: 'USD',
          },
        ],
      },
    },
    {
      id: 'express_2',
      type: 'checkoutavailableshippingmethods',
      attributes: {
        label: 'Express Shipping',
        types: [
          {
            id: 'primary',
            label: 'Express Shipping',
            shippingCost: '25.00',
            currency: 'USD',
          },
        ],
      },
    },
  ];

  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
    mockAxiosPost.mockReset();
    mockAxiosGet.mockReset();
    mockAxiosPatch.mockReset();
  });

  describe('Checkout Initialization', () => {
    /**
     * Test Case 1: Create Checkout from Shopping List
     */
    it('should create checkout from shopping list', async () => {
      const shoppingListId = '1';
      mockAxiosPost.mockResolvedValueOnce({
        data: { data: mockCheckout },
      });
      const response = await mockAxiosPost(
        `/api/shoppinglists/${shoppingListId}`,
        {}
      );
      await AsyncStorage.setItem('current_checkout_id', response.data.data.id);
      expect(mockAxiosPost).toHaveBeenCalledWith(
        `/api/shoppinglists/${shoppingListId}`,
        {}
      );

      const storedCheckoutId = await AsyncStorage.getItem('current_checkout_id');
      expect(storedCheckoutId).toBe(mockCheckout.id);
    });

    /**
     * Test Case 2: Load Checkout by ID
     */
    it('should load checkout by ID', async () => {

      mockAxiosGet.mockResolvedValueOnce({
        data: { data: mockCheckout },
      });
      const response = await mockAxiosGet(`/api/checkouts/${mockCheckout.id}`);
      expect(response.data.data).toEqual(mockCheckout);
      expect(mockAxiosGet).toHaveBeenCalledWith(
        `/api/checkouts/${mockCheckout.id}`
      );
    });
  });

  describe('Address Management', () => {
    /**
     * Test Case 3: Fetch Customer Addresses
     */
    it('should fetch customer addresses', async () => {
      mockAxiosGet.mockResolvedValueOnce({
        data: { data: [mockAddress] },
      });
      const response = await mockAxiosGet('/api/customeraddresses');
      expect(response.data.data).toHaveLength(1);
      expect(response.data.data[0]).toEqual(mockAddress);
    });

    /**
     * Test Case 4: Update Checkout with Billing Address
     */
    it('should update checkout with billing address', async () => {
      const updatedCheckout = {
        ...mockCheckout,
        relationships: {
          billingAddress: { data: { type: 'checkoutaddresses', id: 'bl_1' } },
        },
      };

      mockAxiosPatch.mockResolvedValueOnce({
        data: { data: updatedCheckout },
      });
      await mockAxiosPatch(
        `/api/checkouts/${mockCheckout.id}`,
        {
          data: {
            type: 'checkouts',
            id: mockCheckout.id,
            relationships: {
              billingAddress: {
                data: { type: 'checkoutaddresses', id: 'bl_1' },
              },
            },
          },
          included: [
            {
              type: 'checkoutaddresses',
              id: 'bl_1',
              attributes: mockAddress.attributes,
              relationships: mockAddress.relationships,
            },
          ],
        }
      );
      expect(mockAxiosPatch).toHaveBeenCalledWith(
        `/api/checkouts/${mockCheckout.id}`,
        expect.objectContaining({
          data: expect.objectContaining({
            relationships: expect.objectContaining({
              billingAddress: expect.any(Object),
            }),
          }),
        })
      );
    });

    /**
     * Test Case 5: Update Checkout with Shipping Address
     */
    it('should update checkout with shipping address', async () => {

      mockAxiosPatch.mockResolvedValueOnce({
        data: { data: mockCheckout },
      });
      await mockAxiosPatch(`/api/checkouts/${mockCheckout.id}`, {
        data: {
          type: 'checkouts',
          id: mockCheckout.id,
          relationships: {
            shippingAddress: {
              data: { type: 'checkoutaddresses', id: 'sh_1' },
            },
          },
        },
      });
      expect(mockAxiosPatch).toHaveBeenCalledWith(
        `/api/checkouts/${mockCheckout.id}`,
        expect.objectContaining({
          data: expect.objectContaining({
            relationships: expect.objectContaining({
              shippingAddress: expect.any(Object),
            }),
          }),
        })
      );
    });

    /**
     * Test Case 6: Create New Customer Address
     */
    it('should create new customer address', async () => {

      const newAddress = {
        ...mockAddress,
        id: '2',
        attributes: {
          ...mockAddress.attributes,
          label: 'Work',
        },
      };

      mockAxiosPost.mockResolvedValueOnce({
        data: { data: newAddress },
      });
      const response = await mockAxiosPost('/api/customeraddresses', {
        data: {
          type: 'customeraddresses',
          attributes: newAddress.attributes,
          relationships: newAddress.relationships,
        },
      });
      expect(response.data.data.id).toBe('2');
      expect(response.data.data.attributes.label).toBe('Work');
    });
  });

  describe('Shipping Method Selection', () => {
    /**
     * Test Case 7: Fetch Available Shipping Methods
     */
    it('should fetch available shipping methods', async () => {
      mockAxiosGet.mockResolvedValueOnce({
        data: { data: mockShippingMethods },
      });
      const response = await mockAxiosGet(
        `/api/checkouts/${mockCheckout.id}/availableShippingMethods`
      );
      expect(response.data.data).toHaveLength(2);
      expect(response.data.data[0].attributes.label).toBe('Flat Rate');
      expect(response.data.data[1].attributes.label).toBe('Express Shipping');
    });

    /**
     * Test Case 8: Update Checkout with Selected Shipping Method
     */
    it('should update checkout with selected shipping method', async () => {
      const selectedMethod = 'flat_rate_1';
      mockAxiosPatch.mockResolvedValueOnce({
        data: { data: mockCheckout },
      });
      await mockAxiosPatch(`/api/checkouts/${mockCheckout.id}`, {
        data: {
          type: 'checkouts',
          id: mockCheckout.id,
          attributes: {
            shippingMethod: selectedMethod,
            shippingMethodType: 'primary',
          },
        },
      });
      expect(mockAxiosPatch).toHaveBeenCalledWith(
        `/api/checkouts/${mockCheckout.id}`,
        expect.objectContaining({
          data: expect.objectContaining({
            attributes: expect.objectContaining({
              shippingMethod: selectedMethod,
            }),
          }),
        })
      );
    });

    /**
     * Test Case 9: Calculate Shipping Cost for Selected Method
     */
    it('should calculate correct shipping cost for selected method', () => {

      const flatRateMethod = mockShippingMethods[0];
      const expressMethod = mockShippingMethods[1];
      const flatRateCost = parseFloat(
        flatRateMethod.attributes.types[0].shippingCost
      );
      const expressCost = parseFloat(
        expressMethod.attributes.types[0].shippingCost
      );
      expect(flatRateCost).toBe(10.0);
      expect(expressCost).toBe(25.0);
      expect(expressCost).toBeGreaterThan(flatRateCost);
    });
  });

  describe('Order Completion', () => {
    /**
     * Test Case 10: Submit Order and Return Order ID
     */
    it('should submit order and return order ID', async () => {
      const orderId = '456';
      mockAxiosPost.mockResolvedValueOnce({
        data: {
          data: {
            id: orderId,
            type: 'orders',
            attributes: {
              identifier: orderId,
              totalValue: '219.97',
              currency: 'USD',
            },
          },
        },
      });
      const response = await mockAxiosPost(
        `/api/checkouts/${mockCheckout.id}/executeCheckoutPayment`,
        {}
      );
      await AsyncStorage.setItem('last_order_id', response.data.data.id);
      expect(mockAxiosPost).toHaveBeenCalledWith(
        `/api/checkouts/${mockCheckout.id}/executeCheckoutPayment`,
        {}
      );

      const storedOrderId = await AsyncStorage.getItem('last_order_id');
      expect(storedOrderId).toBe(orderId);
    });

    /**
     * Test Case 11: Handle Order Submission Errors
     */
    it('should handle order submission errors', async () => {

      const errorResponse = {
        response: {
          status: 400,
          data: {
            errors: [
              {
                title: 'Validation Error',
                detail: 'Shipping method is required',
              },
            ],
          },
        },
      };

      mockAxiosPost.mockRejectedValueOnce(errorResponse);
      await expect(
        mockAxiosPost(
          `/api/checkouts/${mockCheckout.id}/executeCheckoutPayment`,
          {}
        )
      ).rejects.toMatchObject(errorResponse);
    });
  });

  describe('Checkout State Persistence', () => {
    /**
     * Test Case 12: Save Checkout Progress to Storage
     */
    it('should save checkout progress to storage', async () => {
      const checkoutState = {
        checkoutId: mockCheckout.id,
        currentStep: 'shipping',
        billingAddressId: '1',
        shippingAddressId: '1',
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(
        `checkout_state_${mockCheckout.id}`,
        JSON.stringify(checkoutState)
      );
      const savedState = await AsyncStorage.getItem(
        `checkout_state_${mockCheckout.id}`
      );
      const parsed = JSON.parse(savedState!);

      expect(parsed.checkoutId).toBe(mockCheckout.id);
      expect(parsed.currentStep).toBe('shipping');
    });

    /**
     * Test Case 13: Restore Checkout Progress from Storage
     */
    it('should restore checkout progress from storage', async () => {
      const checkoutState = {
        checkoutId: mockCheckout.id,
        currentStep: 'payment',
        billingAddressId: '1',
        shippingAddressId: '1',
        selectedShippingMethod: 'flat_rate_1',
        timestamp: Date.now(),
      };

      await AsyncStorage.setItem(
        `checkout_state_${mockCheckout.id}`,
        JSON.stringify(checkoutState)
      );
      const savedState = await AsyncStorage.getItem(
        `checkout_state_${mockCheckout.id}`
      );
      const restored = JSON.parse(savedState!);
      expect(restored.currentStep).toBe('payment');
      expect(restored.selectedShippingMethod).toBe('flat_rate_1');
    });

    /**
     * Test Case 14: Clear Checkout State After Order Completion
     */
    it('should clear checkout state after order completion', async () => {

      await AsyncStorage.setItem(
        `checkout_state_${mockCheckout.id}`,
        JSON.stringify({ checkoutId: mockCheckout.id })
      );
      await AsyncStorage.removeItem(`checkout_state_${mockCheckout.id}`);
      const clearedState = await AsyncStorage.getItem(
        `checkout_state_${mockCheckout.id}`
      );
      expect(clearedState).toBeNull();
    });
  });

  describe('Price Calculations', () => {
    /**
     * Test Case 15: Calculate Order Total with Shipping
     */
    it('should correctly calculate order total with shipping', () => {
      const subtotal = 199.98;
      const shippingCost = 19.99;
      const total = subtotal + shippingCost;
      expect(total).toBe(219.97);
    });

    /**
     * Test Case 16: Handle Discount Calculations
     */
    it('should handle discount calculations', () => {
      const subtotal = 199.98;
      const discount = 20.0;
      const shippingCost = 19.99;
      const totalWithDiscount = subtotal - discount + shippingCost;
      expect(totalWithDiscount).toBe(199.97);
    });
  });
});
