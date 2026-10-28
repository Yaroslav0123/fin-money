import { lazy, Suspense } from 'react';

/*
 * Графики с отложенной загрузкой. Библиотека recharts — самая тяжёлая часть сайта (~115 КБ в сжатом виде),
 * поэтому она скачивается отдельно, уже после того как страница показалась.
 * Пока график грузится, на его месте пустой блок того же размера: размер задаёт className,
 * так что вёрстка не «прыгает», когда график появляется.
 */
const withLazyLoad = (load) => {
  const Chart = lazy(load);
  return function LazyChart(props) {
    return (
      <Suspense fallback={<div className={`shrink-0 ${props.className ?? ''}`} aria-hidden="true" />}>
        <Chart {...props} />
      </Suspense>
    );
  };
};

export const ExpenseDonut = withLazyLoad(() => import('./ExpenseDonut.jsx'));
export const BalanceAreaChart = withLazyLoad(() => import('./BalanceAreaChart.jsx'));
export const SpendingBarChart = withLazyLoad(() => import('./SpendingBarChart.jsx'));
export const IncomeExpenseChart = withLazyLoad(() => import('./IncomeExpenseChart.jsx'));
