// Reason : used for testing
// eslint-disable-next-line @typescript-eslint/ban-types
type CallbackSignature = (params: unknown) => {};

export class SocketTestEmulator {
    on(event: string, callback: CallbackSignature): void {
        if (!this.callbacks.has(event)) {
            this.callbacks.set(event, []);
        }

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        this.callbacks.get(event)!.push(callback);
    }

    // Reason : used for testing (disabled for any and event never used)
    // eslint-disable-next-line
    emit(event: string, ...params: any): void {
        return;
    }

    disconnect(): void {
        return;
    }

    // Reason : used for testing
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    peerSideEmit(event: string, params?: any) {
        if (!this.callbacks.has(event)) {
            return;
        }

        // Reason : used for testing
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        for (const callback of this.callbacks.get(event)!) {
            callback(params);
        }
    }

    // Reason : for the callbacks map to function properly
    // eslint-disable-next-line @typescript-eslint/member-ordering
    private callbacks = new Map<string, CallbackSignature[]>();
}
