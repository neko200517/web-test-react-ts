import { useState, useEffect, useRef } from 'react';
import styles from './Brand.module.css';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import {
  fetchAsyncGetBrands,
  fetchAsyncCreateBrand,
  fetchAsyncUpdateBrand,
  fetchAsyncDeleteBrand,
  editBrand,
  selectBrands,
  selectEditedBrand,
  EditedBrandModel,
} from '../features/vehicleSlice';

const Brand = () => {
  const dispatch = useAppDispatch();
  const brands = useAppSelector(selectBrands);
  const editedBrand = useAppSelector(selectEditedBrand);
  const [successMsg, setSuccessMsg] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // 初期化処理
    const fetchBootLoader = async () => {
      const result = await dispatch(fetchAsyncGetBrands());
      // 取得を失敗した場合
      if (fetchAsyncGetBrands.rejected.match(result)) {
        setSuccessMsg('Get error!');
      }
    };
    fetchBootLoader();
  }, [dispatch]);

  // Createボタン
  const onCreate = async () => {
    // Brandを登録
    await dispatch(
      fetchAsyncCreateBrand({
        brand_name: editedBrand.brand_name,
      })
    );
    await clearEditedValue();
  };

  // Updateボタン
  const onUpdate = async () => {
    const result = await dispatch(fetchAsyncUpdateBrand(editedBrand));
    if (fetchAsyncUpdateBrand.fulfilled.match(result)) {
      setSuccessMsg('Updated in brand!');
    }
    await clearEditedValue();
  };

  // Editボタン
  const onFocusInput = async (brand: EditedBrandModel) => {
    await dispatch(editBrand(brand));
    inputRef.current?.focus();
  };

  // Deleteボタン
  const onDelete = async (id: number) => {
    const result = await dispatch(fetchAsyncDeleteBrand(id));
    if (fetchAsyncDeleteBrand.fulfilled.match(result)) {
      setSuccessMsg('Deleted in brand!');
    }
    await clearEditedValue();
  };

  // editedValueを初期化
  const clearEditedValue = async () => {
    await dispatch(
      editBrand({
        id: 0,
        brand_name: '',
      })
    );
  };

  return (
    <>
      <h3 data-testid='h3-brand'>Brand</h3>
      <span className={styles.brand__status}>{successMsg}</span>

      <div>
        {/* 入力 */}
        <input
          type='text'
          placeholder='new brand name'
          ref={inputRef}
          value={editedBrand.brand_name}
          onChange={async (e) =>
            await dispatch(
              editBrand({ ...editedBrand, brand_name: e.target.value })
            )
          }
        />
        <button
          data-testid='btn-post'
          disabled={!editedBrand.brand_name}
          onClick={() => (editedBrand.id === 0 ? onCreate() : onUpdate())}
        >
          {editedBrand.id === 0 ? 'Create' : 'Update'}
        </button>
        {/* リスト */}
        <ul>
          {brands &&
            brands.map((brand) => (
              <li key={brand.id} className={styles.brand__item}>
                <span data-testid={`list-${brand.id}`}>{brand.brand_name}</span>
                <div>
                  <button
                    data-testid={`edit-brand-${brand.id}`}
                    onClick={() => onFocusInput(brand)}
                  >
                    Edit
                  </button>
                  <button
                    data-testid={`delete-brand-${brand.id}`}
                    onClick={() => onDelete(brand.id!)}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
        </ul>
      </div>
    </>
  );
};

export default Brand;
