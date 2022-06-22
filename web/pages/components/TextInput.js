import { useState } from "react";
import { DebounceInput } from "react-debounce-input";

export const TextInput = ({ className, cb }) => {
    const [aliasAddress, setAliasAddress] = useState("");

    function handleOnAddAddress() {
        if (!aliasAddress) return;

        aliasAddress?.length && cb(aliasAddress);
        setAliasAddress("");
    }

    return (
        <div className={`form-control ${className}`}>
            <label className={`input-group rounded-md border-neutral-content flex"}`}>
                <DebounceInput
                    type="text"
                    placeholder="Enter destination address"
                    value={aliasAddress}
                    debounceTimeout={500}
                    onChange={(e) => setAliasAddress(e.target.value)}
                    className={`flex-1 input input-bordered text-white hover:outline-none focus:outline-none active:outline-none appearance-none`}
                />
                <button className="btn btn-primary" onClick={handleOnAddAddress}>
                    Add
                </button>
            </label>
        </div>
    );
};
