type ConsentCategoryRowProps = {
  id: string;
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
};

export function ConsentCategoryRow({
  id,
  title,
  description,
  checked,
  disabled = false,
  onChange,
}: ConsentCategoryRowProps) {
  const titleId = `${id}-title`;
  const descriptionId = `${id}-description`;

  return (
    <div className="consent-category-row">
      <div className="consent-category-copy">
        <strong id={titleId}>{title}</strong>
        <p id={descriptionId}>{description}</p>
      </div>
      <input
        id={`${id}-switch`}
        className="consent-category-switch"
        type="checkbox"
        role="switch"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange?.(event.currentTarget.checked)}
      />
    </div>
  );
}
