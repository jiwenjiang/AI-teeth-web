import moment from 'moment';
import React, { useState } from 'react';
import { DatetimePicker, Field, Popup } from 'react-vant';
import { FormItemProps } from 'react-vant/es/form';

type CustomItemProps = {
  value?: any;
  onChange?: (v: any) => void;
  placeholder?: string;
} & FormItemProps & { name: any };

export function DatetimePickerItem(props: Partial<CustomItemProps>) {
  const { value, onChange, ...fieldProps } = props;
  const [visible, setVisible] = useState(false);

  const onShow = () => {
    setVisible(true);
  };
  const onCancel = () => {
    setVisible(false);
  };
  const onConfirm = (val) => {
    onChange(val);
    onCancel();
  };
  return (
    <>
      <Field
        readonly
        clickable
        {...fieldProps}
        value={value ? moment(value).format('YYYY-MM-DD') : ''}
        onClick={onShow}
      />
      <Popup position="bottom" round visible={visible} onClose={onCancel}>
        <DatetimePicker
          minDate={new Date(1920, 0, 1)}
          maxDate={new Date()}
          title="选择年月日"
          type="date"
          value={value || new Date(1990, 0, 1)}
          onCancel={onCancel}
          onConfirm={onConfirm}
        />
      </Popup>
    </>
  );
}
