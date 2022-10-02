import { useState } from "react";

function AddressInput({
  address,
  setAddress,
  className,
}: {
  address: string;
  setAddress: (sw: string) => void;
  className?: string;
}) {
  const [text, setText] = useState(address);

  return (
    <div className={className}>
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="min-w-[45ch]"
      />
      {text !== address && (
        <button
          className="border border-gray-500 p-2 rounded-sm"
          onClick={() => setAddress(text)}
        >
          Set
        </button>
      )}
    </div>
  );
}

export default AddressInput;
