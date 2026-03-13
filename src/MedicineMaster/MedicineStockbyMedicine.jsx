// src/components/MedicineStockByMedicine.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import {
  FiArrowLeft,
  FiPackage,
  FiAlertCircle,
  FiCalendar,
  FiDollarSign,
  FiLayers,
} from 'react-icons/fi';
import { getMedicineStockList } from '../Api/ApiPharmacy.js';
import ErrorHandler from '../Hooks/ErrorHandler.jsx';
import Header from '../Header/Header.jsx';
import styles from './MedicineStockByMedicine.module.css';
import { getStoredClinicId, getStoredBranchId } from '../Utils/Cryptoutils.js';

const MedicineStockByMedicine = () => {
  const { medicineId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Get medicine details from navigation state
  const medicineInfo = location.state || {};

  // State
  const [stockList, setStockList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch stock data for this medicine
  useEffect(() => {
    const fetchMedicineStock = async () => {
      try {
        setLoading(true);
        setError(null);

        const clinicId = await getStoredClinicId();
        const branchId = await getStoredBranchId();

        const options = {
          BranchID: branchId,
          MedicineID: Number(medicineId),
          NearExpiryDays: 0,
          ZeroStock: -1,
          NegativeStock: 0,
        };

        const data = await getMedicineStockList(clinicId, options);

        // Sort by expiry date - soonest expiry first
        const sortedData = data.sort((a, b) => {
          const dateA = new Date(a.expiryDate);
          const dateB = new Date(b.expiryDate);
          return dateA - dateB;
        });

        setStockList(sortedData);
      } catch (err) {
        console.error('fetchMedicineStock error:', err);
        setError(
          err?.status >= 400 || err?.code >= 400
            ? err
            : { message: err.message || 'Failed to load medicine stock' }
        );
      } finally {
        setLoading(false);
      }
    };

    fetchMedicineStock();
  }, [medicineId]);

  // Helper functions
  const getStatusClass = (stockStatusDesc) => {
    if (stockStatusDesc?.toLowerCase().includes('expir')) return styles.nearExpiry;
    if (stockStatusDesc?.toLowerCase().includes('zero')) return styles.zeroStock;
    if (stockStatusDesc?.toLowerCase().includes('negative')) return styles.negativeStock;
    return styles.normal;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB');
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (value) => {
    if (value == null) return '—';
    return `₹${Number(value).toFixed(2)}`;
  };

  // Calculate summary statistics
  const calculateStats = () => {
    const totalQuantityIn = stockList.reduce((sum, item) => sum + (item.quantityIn || 0), 0);
    const totalQuantityOut = stockList.reduce((sum, item) => sum + (item.quantityOut || 0), 0);
    const totalBalance = stockList.reduce((sum, item) => sum + (item.balanceQuantity || 0), 0);
    const nearExpiryCount = stockList.filter(item => 
      item.stockStatusDesc?.toLowerCase().includes('expir')
    ).length;
    const zeroStockCount = stockList.filter(item => 
      item.balanceQuantity === 0
    ).length;

    return {
      totalQuantityIn,
      totalQuantityOut,
      totalBalance,
      nearExpiryCount,
      zeroStockCount,
      totalBatches: stockList.length,
    };
  };

  const stats = calculateStats();

  // Handle navigation
  const handleBack = () => {
    navigate(-1);
  };

  const handleUpdateStock = (stock) => {
    navigate(`/update-medicinestock/${stock.id}`);
  };

  // Early returns
  if (error && (error?.status >= 400 || error?.code >= 400)) {
    return <ErrorHandler error={error} />;
  }

  if (loading) return <div className={styles.loading}>Loading stock details...</div>;

  if (error) return <div className={styles.error}>Error: {error.message || error}</div>;

  return (
    <div className={styles.wrapper}>
      <ErrorHandler error={error} />
      <Header title="Medicine Stock Details" />

      {/* Back Button and Medicine Info Header */}
      <div className={styles.headerSection}>
        <button onClick={handleBack} className={styles.backBtn}>
          <FiArrowLeft size={20} />
          Back to Medicines
        </button>

     
         
        <div className={styles.medicineCard}>
          <div className={styles.medicineHeader}>
            <div className={styles.avatarLarge}>
              {medicineInfo.medicineName?.charAt(0).toUpperCase() || 
               stockList[0]?.medicineName?.charAt(0).toUpperCase() || 'M'}
            </div>
            <div className={styles.medicineInfo}>
              <h2 className={styles.medicineName}>
                {medicineInfo.medicineName || stockList[0]?.medicineName || 'Medicine'}
              </h2>
              
            </div>
            
        </div>

          
      </div>
      </div>


      

      {/* Stock Table */}
      <div className={styles.tableSection}>
        <div className={styles.tableSectionHeader}>
          <h3>Stock Batches </h3>
          
        </div>

        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Batch No</th>
                <th>Expiry Date</th>
                <th>Days to Expiry</th>
                <th>Qty In</th>
                <th>Qty Out</th>
                <th>Balance</th>
                <th>Purchase Price</th>
                <th>Avg Price</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {stockList.length === 0 ? (
                <tr>
                  <td colSpan={10} className={styles.noData}>
                    No stock records found for this medicine.
                  </td>
                </tr>
              ) : (
                stockList.map((stock) => (
                  <tr key={stock.id} className={getStatusClass(stock.stockStatusDesc)}>
                    <td>
                      <div className={styles.batchCell}>
                        <FiPackage size={16} className={styles.batchIcon} />
                        <span className={styles.batchNo}>{stock.batchNo || '—'}</span>
                      </div>
                    </td>
                    <td>
                      <div className={styles.dateCell}>
                        <FiCalendar size={14} className={styles.dateIcon} />
                        {formatDate(stock.expiryDate)}
                      </div>
                    </td>
                    <td>
                      {stock.daysToExpiry != null ? (
                        <div className={styles.daysToExpiry}>
                          {stock.daysToExpiry >= 0 ? (
                            <span className={styles.daysRemaining}>
                              {stock.daysToExpiry} days left
                            </span>
                          ) : (
                            <span className={styles.daysExpired}>
                              Expired {Math.abs(stock.daysToExpiry)} days ago
                            </span>
                          )}
                        </div>
                      ) : '—'}
                    </td>
                    <td className={styles.quantityCell}>{stock.quantityIn ?? 0}</td>
                    <td className={styles.quantityCell}>{stock.quantityOut ?? 0}</td>
                    <td>
                      <span className={`${styles.balanceBadge} ${
                        stock.balanceQuantity <= 0 ? styles.lowBalance : 
                        stock.balanceQuantity < 10 ? styles.mediumBalance : 
                        styles.goodBalance
                      }`}>
                        {stock.balanceQuantity ?? 0}
                      </span>
                    </td>
                    <td>
                      <div className={styles.priceCell}>
                        <FiDollarSign size={14} className={styles.priceIcon} />
                        {formatCurrency(stock.purchasePrice)}
                      </div>
                    </td>
                    <td>
                      <div className={styles.priceCell}>
                        {formatCurrency(stock.averagePrice)}
                      </div>
                    </td>
                    <td>
                      <span className={`${styles.statusBadge} ${getStatusClass(stock.stockStatusDesc)}`}>
                        {stock.stockStatusDesc?.toUpperCase() || 'NORMAL'}
                      </span>
                    </td>
                    <td>
                      <button 
                        onClick={() => handleUpdateStock(stock)} 
                        className={styles.updateBtn}
                      >
                        Update
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Footer */}
      
    </div>
  );
};

export default MedicineStockByMedicine;