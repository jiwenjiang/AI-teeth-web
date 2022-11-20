import 'react-vant/lib/index.css';
import './index.less';

import React from 'react';
import ReactDOM from 'react-dom';
import { SWRConfig } from 'swr';

import fetcher from '@/service/fetcher';

import App from './App';

ReactDOM.render(
  <React.StrictMode>
    <SWRConfig
      value={{
        revalidateOnFocus: false,
        shouldRetryOnError: false,
        fetcher,
      }}>
      <App />
    </SWRConfig>
  </React.StrictMode>,
  document.getElementById('root'),
);
