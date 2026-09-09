interface SampleTextFieldComponentProps {
  label: string;
  name: string;
}

export function SampleTextFieldComponent({ name, label }: SampleTextFieldComponentProps) {
  return (
    <label htmlFor={name}>
      {label}
      <input id={name} name={name} type="text" />
    </label>
  );
}
