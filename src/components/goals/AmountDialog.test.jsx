import { fireEvent, render, screen } from '@testing-library/react';
import AmountDialog from './AmountDialog.jsx';
import { AMOUNT_LIMIT, GOALS_PAGE } from '../../data/mockData.js';
import { rub, toRubles } from '../../utils/money.js';

// Ограничения суммы в диалоге пополнения: самое строгое правило и общий потолок.
// Лимиты — в копейках, в поле вводятся рубли.
const { depositDialog } = GOALS_PAGE;
const texts = { ...depositDialog, deposit: { title: depositDialog.titlePrefix, confirm: depositDialog.confirm } };
const NO_FUNDS = texts.errorNoFunds;

const renderDialog = (limits) =>
  render(
    <AmountDialog
      mode="deposit"
      hint={{ label: texts.available, amount: rub(1000) }}
      limits={limits}
      texts={texts}
      onClose={() => {}}
      onConfirm={() => {}}
    />,
  );

const typeAmount = (value) => fireEvent.change(screen.getByLabelText(texts.amountLabel), { target: { value } });
const confirmButton = () => screen.getByRole('button', { name: texts.deposit.confirm });
const fillMaxButton = () => screen.queryByRole('button', { name: new RegExp(texts.fillMax) });

describe('AmountDialog', () => {
  it('разрешает сумму в пределах лимита', () => {
    renderDialog([{ max: rub(1000), error: NO_FUNDS }]);
    typeAmount('1000');
    expect(confirmButton()).toBeEnabled();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('блокирует сумму больше лимита и предлагает максимум', () => {
    renderDialog([{ max: rub(1000), error: NO_FUNDS }]);
    typeAmount('1001');
    expect(confirmButton()).toBeDisabled();
    expect(screen.getByRole('alert')).toHaveTextContent(NO_FUNDS);

    fireEvent.click(fillMaxButton());
    expect(screen.getByLabelText(texts.amountLabel)).toHaveValue(1000);
    expect(confirmButton()).toBeEnabled();
  });

  it('показывает ошибку самого строгого лимита', () => {
    renderDialog([
      { max: rub(5000), error: 'больше остатка' },
      { max: rub(300), error: NO_FUNDS },
    ]);
    typeAmount('400');
    expect(screen.getByRole('alert')).toHaveTextContent(NO_FUNDS);
  });

  it('не даёт пополнить при отрицательном балансе', () => {
    renderDialog([{ max: rub(-500), error: NO_FUNDS }]);
    typeAmount('1');
    expect(confirmButton()).toBeDisabled();
    expect(fillMaxButton()).toBeNull();
  });

  it('ограничивает сумму общим потолком без других правил', () => {
    renderDialog([]);
    typeAmount(String(toRubles(AMOUNT_LIMIT.max) + 1));
    expect(confirmButton()).toBeDisabled();
    expect(screen.getByRole('alert')).toHaveTextContent(AMOUNT_LIMIT.error);
  });
});
