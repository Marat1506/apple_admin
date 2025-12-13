import { useEffect, useState } from 'react';
import api from '../lib/api';
import { useNotification } from '../context/NotificationContext';
import { X, Package, User, MapPin, Truck, CreditCard } from 'lucide-react';

export default function Orders() {
  const { addNotification } = useNotification();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await api.get('/orders/admin/all');
      // Handle wrapped response from TransformInterceptor
      const ordersData = response.data.data || response.data;
      setOrders(Array.isArray(ordersData) ? ordersData : []);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/orders/${id}/status`, { status });
      addNotification('Order status updated successfully', 'success');
      fetchOrders();
      // Update selected order if modal is open
      if (selectedOrder && selectedOrder.id === id) {
        setSelectedOrder({ ...selectedOrder, status });
      }
    } catch (error) {
      addNotification('Failed to update order status', 'error');
      console.error('Failed to update status:', error);
    }
  };

  const openOrderDetails = async (orderId: string) => {
    try {
      const response = await api.get(`/orders/admin/${orderId}`);
      const orderData = response.data.data || response.data;
      setSelectedOrder(orderData);
      setShowModal(true);
    } catch (error) {
      addNotification('Failed to load order details', 'error');
      console.error('Failed to fetch order details:', error);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedOrder(null);
  };

  const closeOrder = async (orderId: string) => {
    try {
      await updateStatus(orderId, 'delivered');
      addNotification('Order closed successfully', 'success');
      closeModal();
    } catch (error) {
      addNotification('Failed to close order', 'error');
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
        <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
          {orders.length} {orders.length === 1 ? 'order' : 'orders'}
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500 text-lg">No orders found</p>
          <p className="text-gray-400 text-sm mt-2">Orders will appear here when customers place them</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="px-6 py-4 text-sm font-mono text-gray-900">
                    {order.id.substring(0, 8)}...
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div>
                      <div className="font-medium">{order.user?.fullName || 'Unknown'}</div>
                      <div className="text-gray-500">{order.user?.email || 'No email'}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">${order.total}</td>
                  <td className="px-6 py-4">
                    <select
                      value={order.status}
                      onChange={(e) => updateStatus(order.id, e.target.value)}
                      className={`text-sm border-gray-300 rounded-md px-2 py-1 ${
                        order.status === 'pending' ? 'bg-yellow-50 text-yellow-800' :
                        order.status === 'processing' ? 'bg-blue-50 text-blue-800' :
                        order.status === 'shipped' ? 'bg-purple-50 text-purple-800' :
                        order.status === 'delivered' ? 'bg-green-50 text-green-800' :
                        'bg-red-50 text-red-800'
                      }`}
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm space-x-2">
                    <button 
                      onClick={() => openOrderDetails(order.id)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      View Details
                    </button>
                    {order.status !== 'delivered' && order.status !== 'cancelled' && (
                      <button 
                        onClick={() => closeOrder(order.id)}
                        className="text-green-600 hover:text-green-900 ml-2"
                      >
                        Close Order
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Order Details Modal */}
      {showModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Order Details - #{selectedOrder.id.substring(0, 8)}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Customer Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <User className="w-5 h-5 text-gray-600 mr-2" />
                  <h3 className="text-lg font-semibold">Customer Information</h3>
                </div>
                <div className="space-y-2">
                  <p><span className="font-medium">Name:</span> {selectedOrder.user?.fullName || 'Unknown'}</p>
                  <p><span className="font-medium">Email:</span> {selectedOrder.user?.email || 'No email'}</p>
                </div>
              </div>

              {/* Order Status */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <Package className="w-5 h-5 text-gray-600 mr-2" />
                  <h3 className="text-lg font-semibold">Order Status</h3>
                </div>
                <div className="space-y-2">
                  <p><span className="font-medium">Status:</span> 
                    <span className={`ml-2 px-2 py-1 rounded text-sm ${
                      selectedOrder.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      selectedOrder.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                      selectedOrder.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                      selectedOrder.status === 'delivered' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                    </span>
                  </p>
                  <p><span className="font-medium">Order Date:</span> {new Date(selectedOrder.createdAt).toLocaleString()}</p>
                  <p><span className="font-medium">Total:</span> <span className="text-lg font-bold">${selectedOrder.total}</span></p>
                </div>
              </div>

              {/* Shipping Address */}
              {selectedOrder.shippingAddress && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <MapPin className="w-5 h-5 text-gray-600 mr-2" />
                    <h3 className="text-lg font-semibold">Shipping Address</h3>
                  </div>
                  <div className="space-y-1">
                    <p>{selectedOrder.shippingAddress.fullName}</p>
                    <p>{selectedOrder.shippingAddress.address}</p>
                    <p>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.postalCode}</p>
                    <p>{selectedOrder.shippingAddress.country}</p>
                  </div>
                </div>
              )}

              {/* Shipping Method */}
              {selectedOrder.shippingMethod && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <Truck className="w-5 h-5 text-gray-600 mr-2" />
                    <h3 className="text-lg font-semibold">Shipping Method</h3>
                  </div>
                  <div className="space-y-1">
                    <p><span className="font-medium">Method:</span> {selectedOrder.shippingMethod.type}</p>
                    <p><span className="font-medium">Cost:</span> ${selectedOrder.shippingMethod.cost}</p>
                    <p><span className="font-medium">Estimated Days:</span> {selectedOrder.shippingMethod.estimatedDays}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Order Items */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4">Order Items</h3>
              <div className="bg-white border rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {selectedOrder.items?.map((item: any) => (
                      <tr key={item.id}>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <img
                              src={item.product?.images?.[0] || 'https://via.placeholder.com/50'}
                              alt={item.product?.name || 'Product'}
                              className="w-12 h-12 rounded object-cover mr-4"
                            />
                            <div>
                              <div className="font-medium">{item.product?.name || 'Unknown Product'}</div>
                              {item.selectedVariant && (
                                <div className="text-sm text-gray-500">
                                  {item.selectedVariant.color && `Color: ${item.selectedVariant.color}`}
                                  {item.selectedVariant.storage && `, Storage: ${item.selectedVariant.storage}`}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">${item.price}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{item.quantity}</td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          ${(item.price * item.quantity).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 mt-6 pt-6 border-t">
              <select
                value={selectedOrder.status}
                onChange={(e) => updateStatus(selectedOrder.id, e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
              
              {selectedOrder.status !== 'delivered' && selectedOrder.status !== 'cancelled' && (
                <button
                  onClick={() => closeOrder(selectedOrder.id)}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  Close Order (Mark as Delivered)
                </button>
              )}
              
              <button
                onClick={closeModal}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
