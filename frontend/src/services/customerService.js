/**
 * Customer services — profile and address management.
 */
export const customerService = {
  getProfile(provider) {
    return provider.getCustomerProfile();
  },
  updateProfile(provider, data) {
    return provider.updateCustomerProfile(data);
  },
  getAddresses(provider) {
    return provider.getCustomerAddresses();
  },
  addAddress(provider, data) {
    return provider.addCustomerAddress(data);
  },
  updateAddress(provider, data) {
    return provider.updateCustomerAddress(data);
  },
  deleteAddress(provider, id) {
    return provider.deleteCustomerAddress(id);
  },
  setDefaultAddress(provider, id) {
    return provider.setDefaultCustomerAddress(id);
  },
};

export default customerService;
