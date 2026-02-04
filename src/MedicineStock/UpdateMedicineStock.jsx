// src/components/UpdateMedicineStock.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiSave } from 'react-icons/fi';
import { getMedicineStockList, updateMedicineStock } from '../api/api-pharmacy.js';
import ErrorHandler from '../hooks/Errorhandler.jsx';
import Header from '../Header/Header.jsx';
import styles from './MedicineStockList.module.css';

// ────────────────────────────────────────────────
const UpdateMedicineStock = () => {
  const navigate = useNavigate();
  const params = useParams();
  
  const stockId = params.stockId || params.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stockData, setStockData] = useState(null);

  const [formData, setFormData] = useState({
    BatchNo: '',
    ExpiryDate: '',
    QuantityIn: '',
    PurchasePrice: '',
  });

  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);

  // ────────────────────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const clinicId = Number(localStorage.getItem('clinicID'));
        const branchId = Number(localStorage.getItem('branchID'));

        const options = {
          BranchID: branchId,
          NearExpiryDays: 0,
          ZeroStock: -1,
          NegativeStock: 0,
        };

        const stockList = await getMedicineStockList(clinicId, options);
        const stock = stockList.find((s) => s.id === Number(stockId));

        if (!stock) {
          throw new Error(`Medicine stock not found with ID: ${stockId}`);
        }

        setStockData(stock);

        // Format date for input field (YYYY-MM-DD)
        let formattedDate = '';
        if (stock.expiryDate) {
          try {
            const date = new Date(stock.expiryDate);
            formattedDate = date.toISOString().split('T')[0];
          } catch {
            formattedDate = stock.expiryDate;
          }
        }

        setFormData({
          BatchNo: stock.batchNo || '',
          ExpiryDate: formattedDate,
          QuantityIn: stock.quantityIn ?? '',
          PurchasePrice: stock.purchasePrice || '',
        });
      } catch (err) {
        setError({
          message: err.message || 'Failed to load medicine stock data',
          status: err.status || 500,
        });
      } finally {
        setLoading(false);
      }
    };

    if (stockId) {
      fetchData();
    } else {
      setLoading(false);
      setError({ message: 'No stock ID provided', status: 400 });
    }
  }, [stockId]);

  // ────────────────────────────────────────────────
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBack = () => {
    navigate('/medicinestock-list');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    setFormSuccess(false);

    try {
      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));

      await updateMedicineStock({
        StockID: Number(stockId),
        clinicId: clinicId,
        branchId: branchId,
        BatchNo: formData.BatchNo.trim(),
        ExpiryDate: formData.ExpiryDate.trim(),
        QuantityIn: Number(formData.QuantityIn),
        PurchasePrice: Number(formData.PurchasePrice),
      });

      setFormSuccess(true);
      setTimeout(() => {
        navigate('/medicinestock-list');
      }, 1500);
    } catch (err) {
      setFormError(err.message || 'Failed to update medicine stock.');
    } finally {
      setFormLoading(false);
    }
  };

  // ────────────────────────────────────────────────
  // Helper functions
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

  // ────────────────────────────────────────────────
  if (error && error?.status >= 400) {
    return <ErrorHandler error={error} />;
  }

  if (loading) {
    return <div className={styles.loading}>Loading medicine stock data...</div>;
  }

  if (error) {
    return (
      <div className={styles.wrapper}>
        <Header title="Update Medicine Stock" />
        <div className={styles.error}>Error: {error.message || error}</div>
        <button onClick={handleBack} className={styles.backBtn}>
          <FiArrowLeft size={20} /> Back to List
        </button>
      </div>
    );
  }

  if (!stockData) {
    return (
      <div className={styles.wrapper}>
        <Header title="Update Medicine Stock" />
        <div className={styles.error}>Medicine stock not found</div>
        <button onClick={handleBack} className={styles.backBtn}>
          <FiArrowLeft size={20} /> Back to List
        </button>
      </div>
    );
  }

  // ────────────────────────────────────────────────
  return (
    <div className={styles.wrapper}>
      <ErrorHandler error={error} />
      <Header title="Update Medicine Stock" />

      <div className={styles.toolbar}>
        <button onClick={handleBack} className={styles.backBtn}>
         <FiArrowLeft size={20} />
          Back to List
        </button>
      </div>

      <div className={`${styles.tableContainer} ${styles.updateContainer}`} style={{ padding: '20px', borderRadius: '17px' }}>
        <div className={`${styles.modal} ${styles.formModal} ${styles.updateForm}`} style={{ maxWidth: 'none', width: '100%', maxHeight: 'none' }}>
          <div className={`${styles.modalHeader} ${styles.updateHeader}`}>
            <h2>Update Stock: {stockData.medicineName}</h2>
          </div>

          <form onSubmit={handleSubmit} className={styles.modalBody}>
            {formError && <div className={styles.formError}>{formError}</div>}
            {formSuccess && <div className={styles.formSuccess}>Medicine stock updated successfully!</div>}

            <div className={styles.formGrid}>
              <h3 className={styles.formSectionTitle}>Stock Information</h3>

              {/* Read-only fields for context */}
              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label>Medicine Name</label>
                <input
                  type="text"
                  value={stockData.medicineName || ''}
        
                  style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed' }}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Generic Name</label>
                <input
                  type="text"
                  value={stockData.genericName || '—'}
                  disabled
                  style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed' }}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Manufacturer</label>
                <input
                  type="text"
                  value={stockData.manufacturer || '—'}
                  disabled
                  style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed' }}
                />
              </div>

              <h3 className={styles.formSectionTitle}>Editable Fields</h3>

              <div className={styles.formGroup}>
                <label>
                  Batch Number <span className={styles.required}>*</span>
                </label>
                <input
                  required
                  name="BatchNo"
                  value={formData.BatchNo}
                  onChange={handleInputChange}
                />
              </div>

              <div className={styles.formGroup}>
                <label>
                  Expiry Date <span className={styles.required}>*</span>
                </label>
                <input
                  required
                  type="date"
                  name="ExpiryDate"
                  value={formData.ExpiryDate}
                  onChange={handleInputChange}
                />
              </div>

              <div className={styles.formGroup}>
                <label>
                  Quantity In <span className={styles.required}>*</span>
                </label>
                <input
                  required
                  type="number"
                  name="QuantityIn"
                  value={formData.QuantityIn}
                  onChange={handleInputChange}
                  min="0"
                />
              </div>

              <div className={styles.formGroup}>
                <label>
                  Purchase Price <span className={styles.required}>*</span>
                </label>
                <input
                  required
                  type="number"
                  step="0.01"
                  name="PurchasePrice"
                  value={formData.PurchasePrice}
                  onChange={handleInputChange}
                  min="0"
                />
              </div>

              <h3 className={styles.formSectionTitle}>Current Stock Status</h3>

              <div className={styles.formGroup}>
                <label>Quantity Out</label>
                <input
                  type="number"
                  value={stockData.quantityOut ?? 0}
                  disabled
                  style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed' }}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Balance Quantity</label>
                <input
                  type="number"
                  value={stockData.balanceQuantity ?? 0}
                  disabled
                  style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed' }}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Average Price</label>
                <input
                  type="text"
                  value={formatCurrency(stockData.averagePrice)}
                  disabled
                  style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed' }}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Days to Expiry</label>
                <input
                  type="text"
                  value={
                    stockData.daysToExpiry != null
                      ? stockData.daysToExpiry >= 0
                        ? `${stockData.daysToExpiry} days`
                        : `Expired ${Math.abs(stockData.daysToExpiry)} days ago`
                      : '—'
                  }
                  disabled
                  style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed' }}
                />
              </div>
            </div>

            <div className={`${styles.modalFooter} ${styles.updateFooter}`}>
              <button type="button" onClick={handleBack} className={styles.btnCancel}>
                Cancel
              </button>
              <button type="submit" disabled={formLoading} className={styles.btnSubmit}>
                <FiSave className={styles.btnIcon} />
                {formLoading ? 'Updating...' : 'Update Stock'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UpdateMedicineStock;