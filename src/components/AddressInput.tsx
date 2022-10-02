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
        className="min-w-[45ch] px-2 py-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 focus:outline-none focus:border-gray-600 dark:focus:border-gray-300"
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
