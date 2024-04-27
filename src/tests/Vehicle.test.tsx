import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import vehicleReducer from '../features/vehicleSlice';
import Vehicle from '../components/Vehicle';
import Brand from '../components/Brand';
import Segment from '../components/Segment';

const handlers = [
  // 事前にSegmentとBrandのデータを用意
  http.get('http://localhost:8000/api/segments/', () => {
    return HttpResponse.json([
      { id: 1, segment_name: 'SUV' },
      { id: 2, segment_name: 'EV' },
    ]);
  }),
  http.get('http://localhost:8000/api/brands/', () => {
    return HttpResponse.json([
      { id: 1, brand_name: 'Audi' },
      { id: 2, brand_name: 'Tesla' },
    ]);
  }),
  // Cascade Deleteの検証(Segment)
  http.delete('http://localhost:8000/api/segments/1/', () => {
    return HttpResponse.json();
  }),
  http.delete('http://localhost:8000/api/segments/2/', () => {
    return HttpResponse.json();
  }),
  // Cascade Deleteの検証(Brand)
  http.delete('http://localhost:8000/api/brands/1/', () => {
    return HttpResponse.json();
  }),
  http.delete('http://localhost:8000/api/brands/2/', () => {
    return HttpResponse.json();
  }),
  // Vehiclesの一覧取得
  http.get('http://localhost:8000/api/vehicles/', () => {
    return HttpResponse.json([
      {
        id: 1,
        vehicle_name: 'SQ7',
        release_year: 2019,
        price: 300.12,
        segment: 1,
        brand: 1,
        segment_name: 'SUV',
        brand_name: 'Audi',
      },
      {
        id: 2,
        vehicle_name: 'MODEL S',
        release_year: 2020,
        price: 400.12,
        segment: 2,
        brand: 2,
        segment_name: 'EV',
        brand_name: 'Tesla',
      },
    ]);
  }),
  // Vehicleの新規登録
  http.post('http://localhost:8000/api/vehicles/', () => {
    return HttpResponse.json({
      id: 3,
      vehicle_name: 'MODEL X',
      release_year: 2019,
      price: 350.12,
      segment: 2,
      brand: 2,
      segment_name: 'EV',
      brand_name: 'Tesla',
    });
  }),
  // Vehicleの更新（id 1）
  http.put('http://localhost:8000/api/vehicles/1/', () => {
    return HttpResponse.json({
      id: 1,
      vehicle_name: 'new SQ7',
      release_year: 2019,
      price: 350.12,
      segment: 1,
      brand: 1,
      segment_name: 'SUV',
      brand_name: 'Audi',
    });
  }),
  // Vehicleの更新（id 2）
  http.put('http://localhost:8000/api/vehicles/2/', () => {
    return HttpResponse.json({
      id: 2,
      vehicle_name: 'new MODEL S',
      release_year: 2020,
      price: 400.12,
      segment: 2,
      brand: 2,
      segment_name: 'EV',
      brand_name: 'Tesla',
    });
  }),
  // Vehicleの削除（id 1）
  http.delete('http://localhost:8000/api/vehicles/1/', () => {
    return HttpResponse.json();
  }),
  // Vehicleの削除（id 2）
  http.delete('http://localhost:8000/api/vehicles/2/', () => {
    return HttpResponse.json();
  }),
];
const server = setupServer(...handlers);

beforeAll(() => {
  server.listen();
});
afterEach(() => {
  server.resetHandlers();
  cleanup();
});
afterAll(() => {
  server.close();
});

describe('Vehicle Component Test Cases', () => {
  let store: any;
  beforeEach(() => {
    // Reduxの初期化
    store = configureStore({
      reducer: {
        vehicle: vehicleReducer,
      },
    });
  });

  // Vehicleコンポーネント要素の表示
  it('1: Should render all the elements correctly', async () => {
    render(
      <Provider store={store}>
        <Vehicle />
      </Provider>
    );

    // 以下の各要素が存在すること
    expect(screen.getByTestId('h3-vehicle')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('new vehicle name')).toBeTruthy();
    expect(screen.getByPlaceholderText('year of release')).toBeTruthy();
    expect(screen.getByPlaceholderText('price')).toBeTruthy();
    expect(screen.getByTestId('select-segment')).toBeTruthy();
    expect(screen.getByTestId('select-brand')).toBeTruthy();
    expect(screen.getByTestId('btn-vehicle-post')).toBeTruthy();

    // 非同期関数が完了するまで待機
    expect(await screen.findByText('SQ7')).toBeInTheDocument();

    // 一覧が存在すること
    expect(screen.getAllByRole('listitem')[0]).toBeTruthy();
    expect(screen.getAllByRole('listitem')[1]).toBeTruthy();

    // 一覧の中にEdit, Deleteボタンが存在すること
    expect(screen.getByTestId('edit-veh-1')).toBeTruthy();
    expect(screen.getByTestId('edit-veh-2')).toBeTruthy();
    expect(screen.getByTestId('delete-veh-1')).toBeTruthy();
    expect(screen.getByTestId('delete-veh-2')).toBeTruthy();
  });

  // Vehicle一覧の表示
  it('2: Should render list of vehicles from REST API', async () => {
    render(
      <Provider store={store}>
        <Vehicle />
      </Provider>
    );
    // 非同期完了前は以下の項目が存在しないこと
    expect(screen.queryByText('SQ7')).toBeNull();
    expect(screen.queryByText('MODEL S')).toBeNull();

    // 非同期関数が完了するまで待機
    expect(await screen.findByText('SQ7')).toBeInTheDocument();

    // 一覧の名前に以下の文言が一致していること
    expect(screen.getByTestId('name-1').textContent).toBe('SQ7');
    expect(screen.getByTestId('name-2').textContent).toBe('MODEL S');
  });

  // Vehicle一覧の表示（API実行失敗の場合）
  it('3: Should render list of vehicles from REST API', async () => {
    server.use(
      http.get('http://localhost:8000/api/vehicles/', () => {
        return HttpResponse.error();
      })
    );
    render(
      <Provider store={store}>
        <Vehicle />
      </Provider>
    );
    // 非同期完了前は以下の項目が存在しないこと
    expect(screen.queryByText('SQ7')).toBeNull();
    expect(screen.queryByText('MODEL S')).toBeNull();

    // 一覧の取得に失敗したら以下の文言が表示されること
    expect(await screen.findByText('Get error!')).toBeInTheDocument();

    // 非同期関数が完了しても以下の項目が存在しないこと
    expect(screen.queryByText('SQ7')).toBeNull();
    expect(screen.queryByText('MODE S')).toBeNull();
  });

  // データが新規登録されること
  it('4: Should add new vehicle and also to the list', async () => {
    render(
      <Provider store={store}>
        <Segment />
        <Brand />
        <Vehicle />
      </Provider>
    );
    // 非同期完了前は以下の項目が存在しないこと
    expect(screen.queryByText('MODEL X')).toBeNull();

    // 非同期完了するまで待機
    expect(await screen.findByText('SQ7')).toBeInTheDocument();

    // 必要な項目を入力後、Createボタンを押下する
    const inputVehicleName = screen.getByPlaceholderText('new vehicle name');
    const inputReleaseYear = screen.getByPlaceholderText('year of release');
    const inputPrice = screen.getByPlaceholderText('price');
    await userEvent.type(inputVehicleName, 'MODEL X');
    await userEvent.type(inputReleaseYear, '2020');
    await userEvent.type(inputPrice, '400.12');
    await userEvent.selectOptions(screen.getByTestId('select-segment'), '2');
    await userEvent.selectOptions(screen.getByTestId('select-brand'), '2');
    await userEvent.click(screen.getByTestId('btn-vehicle-post'));

    // 以下のデータが新規登録されていること
    expect(await screen.findByText('MODEL X')).toBeInTheDocument();
  });

  // データが削除されること（id 1）
  it('5: Should delete vehicle(id 1) and also from list', async () => {
    render(
      <Provider store={store}>
        <Vehicle />
      </Provider>
    );
    // 非同期処理が完了するまで待機
    expect(await screen.findByText('SQ7')).toBeInTheDocument();

    // 削除ボタンを押下する
    await userEvent.click(screen.getByTestId('delete-veh-1'));

    // 非同期処理が完了するまで待機
    expect(await screen.findByText('Deleted in vehicle!')).toBeInTheDocument();

    // 以下のデータが削除されていること
    expect(screen.queryByText('SQ7')).toBeNull();
  });

  // データが削除されること（id 2）
  it('6: Should delete vehicle(id 2) and also from list', async () => {
    render(
      <Provider store={store}>
        <Vehicle />
      </Provider>
    );
    // 非同期処理が完了するまで待機
    expect(await screen.findByText('MODEL S')).toBeInTheDocument();

    // 削除ボタンを押下する
    await userEvent.click(screen.getByTestId('delete-veh-2'));

    // 非同期処理が完了するまで待機
    expect(await screen.findByText('Deleted in vehicle!')).toBeInTheDocument();

    // 以下のデータが削除されていること
    expect(screen.queryByText('MODEL S')).toBeNull();
  });

  // データが更新されること（id 1）
  it('7: Should update vehicle(id 1) and also in the list', async () => {
    render(
      <Provider store={store}>
        <Vehicle />
      </Provider>
    );
    // 非同期処理が完了するまで待機
    expect(await screen.findByText('SQ7')).toBeInTheDocument();

    // Editボタンを押下して更新ボタンを押下する
    const inputVehicleName = screen.getByPlaceholderText('new vehicle name');
    await userEvent.click(screen.getByTestId('edit-veh-1'));
    await userEvent.type(inputVehicleName, 'new SQ7');
    await userEvent.click(screen.getByTestId('btn-vehicle-post'));

    // 非同期処理が完了するまで待機
    expect(await screen.findByText('Updated in vehicle!')).toBeInTheDocument();

    // 以下のデータが更新されていること
    expect(screen.getByTestId('name-1').textContent).toBe('new SQ7');
  });

  // データが更新されること（id 2）
  it('8: Should update vehicle(id 2) and also in the list', async () => {
    render(
      <Provider store={store}>
        <Vehicle />
      </Provider>
    );
    // 非同期処理が完了するまで待機
    expect(await screen.findByText('MODEL S')).toBeInTheDocument();

    // Editボタンを押下して更新ボタンを押下する
    const inputVehicleName = screen.getByPlaceholderText('new vehicle name');
    await userEvent.click(screen.getByTestId('edit-veh-2'));
    await userEvent.type(inputVehicleName, 'new MODEL S');
    await userEvent.click(screen.getByTestId('btn-vehicle-post'));

    // 非同期処理が完了するまで待機
    expect(await screen.findByText('Updated in vehicle!')).toBeInTheDocument();

    // 以下のデータが更新されていること
    expect(screen.getByTestId('name-2').textContent).toBe('new MODEL S');
  });

  // CASCADE DELETEされること（segment:id 2）
  it('9: Should MODEL S(id 2) cascade deleted when EV(id 2) seg deleted', async () => {
    render(
      <Provider store={store}>
        <Segment />
        <Brand />
        <Vehicle />
      </Provider>
    );

    // 非同期処理が完了するまで以下のデータが存在しないこと
    expect(screen.queryByText('SQ7')).toBeNull();
    expect(screen.queryByText('MODEL S')).toBeNull();

    // 非同期処理が完了するまで待機
    expect(await screen.findByText('SQ7')).toBeInTheDocument();
    expect(screen.getByTestId('name-2').textContent).toBe('MODEL S');

    // Segmentコンポーネントの削除ボタンを押下する
    await userEvent.click(screen.getByTestId('delete-seg-2'));

    // 非同期処理が完了するまで待機
    expect(await screen.findByText('Deleted in segment!')).toBeInTheDocument();

    // 以下の要素が存在しないこと
    expect(screen.queryByText('MODEL S')).toBeNull();

    // 削除されていない要素は存在すること
    expect(screen.getByTestId('name-1').textContent).toBe('SQ7');
  });

  // CASCADE DELETEされること（brand:id 2）
  it('10: Should MODEL S(id 2) cascade deleted when Tesla(id 2) brand deleted', async () => {
    render(
      <Provider store={store}>
        <Segment />
        <Brand />
        <Vehicle />
      </Provider>
    );

    // 非同期処理が完了するまで以下のデータが存在しないこと
    expect(screen.queryByText('SQ7')).toBeNull();
    expect(screen.queryByText('MODEL S')).toBeNull();

    // 非同期処理が完了するまで待機
    expect(await screen.findByText('SQ7')).toBeInTheDocument();
    expect(screen.getByTestId('name-2').textContent).toBe('MODEL S');

    // Brandコンポーネントの削除ボタンを押下する
    await userEvent.click(screen.getByTestId('delete-brand-2'));

    // 非同期処理が完了するまで待機
    expect(await screen.findByText('Deleted in brand!')).toBeInTheDocument();

    // 以下の要素が存在しないこと
    expect(screen.queryByText('MODEL S')).toBeNull();

    // 削除されていない要素は存在すること
    expect(screen.getByTestId('name-1').textContent).toBe('SQ7');
  });

  // CASCADE DELETEされること（segment:id 1）
  it('11: Should SQ7(id 1) cascade deleted when SUV(id 1) seg deleted', async () => {
    render(
      <Provider store={store}>
        <Segment />
        <Brand />
        <Vehicle />
      </Provider>
    );

    // 非同期処理が完了するまで以下のデータが存在しないこと
    expect(screen.queryByText('SQ7')).toBeNull();
    expect(screen.queryByText('MODEL S')).toBeNull();

    // 非同期処理が完了するまで待機
    expect(await screen.findByText('SQ7')).toBeInTheDocument();
    expect(screen.getByTestId('name-2').textContent).toBe('MODEL S');

    // Segmentコンポーネントの削除ボタンを押下する
    await userEvent.click(screen.getByTestId('delete-seg-1'));

    // 非同期処理が完了するまで待機
    expect(await screen.findByText('Deleted in segment!')).toBeInTheDocument();

    // 以下の要素が存在しないこと
    expect(screen.queryByText('SQ7')).toBeNull();

    // 削除されていない要素は存在すること
    expect(screen.getByTestId('name-2').textContent).toBe('MODEL S');
  });

  // CASCADE DELETEされること（brand:id 1）
  it('12: Should SQ7(id 1) cascade deleted when Audi(id 1) seg deleted', async () => {
    render(
      <Provider store={store}>
        <Segment />
        <Brand />
        <Vehicle />
      </Provider>
    );

    // 非同期処理が完了するまで以下のデータが存在しないこと
    expect(screen.queryByText('SQ7')).toBeNull();
    expect(screen.queryByText('MODEL S')).toBeNull();

    // 非同期処理が完了するまで待機
    expect(await screen.findByText('SQ7')).toBeInTheDocument();
    expect(screen.getByTestId('name-2').textContent).toBe('MODEL S');

    // Brandコンポーネントの削除ボタンを押下する
    await userEvent.click(screen.getByTestId('delete-brand-1'));

    // 非同期処理が完了するまで待機
    expect(await screen.findByText('Deleted in brand!')).toBeInTheDocument();

    // 以下の要素が存在しないこと
    expect(screen.queryByText('SQ7')).toBeNull();

    // 削除されていない要素は存在すること
    expect(screen.getByTestId('name-2').textContent).toBe('MODEL S');
  });
});
