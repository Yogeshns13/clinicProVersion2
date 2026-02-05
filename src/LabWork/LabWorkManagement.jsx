// src/components/LabWork/LabWorkManagement.jsx
import React, { useState } from 'react';
import LabOrderList from './LabOrderList';
import LabWorkQueue from './LabWorkQueue';
import LabWorkDetail from './LabWorkDetail';

const LabWorkManagement = () => {
  const [activeView, setActiveView] = useState('orders'); // 'orders' or 'queue'
  const [selectedWorkItem, setSelectedWorkItem] = useState(null);
  const [selectedOrderData, setSelectedOrderData] = useState(null);

  const handleNavigateToWorkQueue = () => {
    setActiveView('queue');
  };

  const handleNavigateToOrders = () => {
    setActiveView('orders');
  };

  const handleSelectWorkItem = (workItem, orderData) => {
    setSelectedWorkItem(workItem);
    setSelectedOrderData(orderData);
  };

  const handleCloseWorkDetail = () => {
    setSelectedWorkItem(null);
    setSelectedOrderData(null);
  };

  const handleSaveWorkDetail = () => {
    // Refresh the current view after saving
    // The individual components will handle their own refresh logic
  };

  return (
    <>
      {activeView === 'orders' ? (
        <LabOrderList onNavigateToWorkQueue={handleNavigateToWorkQueue} />
      ) : (
        <LabWorkQueue 
          onSelectWorkItem={handleSelectWorkItem}
          onNavigateToOrders={handleNavigateToOrders}
        />
      )}

      {selectedWorkItem && selectedOrderData && (
        <LabWorkDetail
          workItem={selectedWorkItem}
          orderData={selectedOrderData}
          onClose={handleCloseWorkDetail}
          onSave={handleSaveWorkDetail}
        />
      )}
    </>
  );
};

export default LabWorkManagement;