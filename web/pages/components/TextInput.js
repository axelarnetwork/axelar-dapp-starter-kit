import { useCallback, useState, useEffect } from "react";
import { DebounceInput } from "react-debounce-input";

export const TextInput = ({ className, cb }) => {
    const [aliasAddress, setAliasAddress] = useState("");

    const onKeyDown = useCallback(
        (e) => {
            e.stopPropagation();
            if (!aliasAddress) return;
            if (!(e.code === "Enter" || e.code === "NumpadEnter")) return;

            aliasAddress?.length && cb(aliasAddress);
            setAliasAddress("");
        },
        [aliasAddress]
    );

    return (
        <div className={`form-control ${className}`}>
            <label className={`input-group rounded-md border-2 border-neutral-content flex"}`}>
                <DebounceInput
                    type="text"
                    placeholder="Destination Address (+Enter)"
                    value={aliasAddress}
                    debounceTimeout={500}
                    onChange={(e) => setAliasAddress(e.target.value)}
                    onKeyDown={onKeyDown}
                    className={`flex-1 input input-bordered text-white hover:outline-none focus:outline-none active:outline-none border-0 appearance-none`}
                />
            </label>
        </div>
    );
};