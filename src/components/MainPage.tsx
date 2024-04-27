import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './MainPage.module.css';
import Grid from '@mui/material/Grid';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { fetchAsyncGetProfile, selectProfile } from '../features/authSlice';
import Segment from './Segment';
import Brand from './Brand';
import Vehicle from './Vehicle';

const MainPage = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const profile = useAppSelector(selectProfile);

  // ログアウト
  const logout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  useEffect(() => {
    // 初期化処理
    const fetchBootLoader = async () => {
      // ユーザー情報の取得
      await dispatch(fetchAsyncGetProfile());
    };
    fetchBootLoader();
  }, [dispatch]);

  return (
    <div className={styles.mainPage__root}>
      <Grid container>
        {/* ユーザー名 */}
        <Grid item xs>
          {profile.username}
        </Grid>

        {/* タイトル */}
        <Grid item xs>
          <span data-testid='span-title' className={styles.mainPage__title}>
            Vehicle register system
          </span>
        </Grid>

        {/* ログアウトボタン */}
        <Grid item xs>
          <button data-testid='btn-logout' onClick={logout}>
            Logout
          </button>
        </Grid>
      </Grid>
      <Grid container>
        <Grid item xs={3}>
          <Segment />
        </Grid>
        <Grid item xs={3}>
          <Brand />
        </Grid>
        <Grid item xs={6}>
          <Vehicle />
        </Grid>
      </Grid>
    </div>
  );
};

export default MainPage;
