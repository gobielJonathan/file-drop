import { FILE_DONE, FILE_METADATA, FILE_PROGRESS } from "@/utils/event-peer";

const chunkSize = 512 * 1024; // 512KB

export default function useSendFile() {

    function sendFile({
        file,
        onProgress = () => { },
    }) {
        let offset = 0;

        const meta = { type: FILE_METADATA, data :{
            name: file.name, size: file.size, progress: 0
        } };
        onProgress(JSON.stringify(meta));

        const reader = new FileReader();
        reader.onerror = console.error;

        reader.onload = (e) => {
            const buffer = e.target.result;

            const sendChunk = () => {
                onProgress(buffer);
                offset += buffer.byteLength;

                const meta = { type: FILE_PROGRESS, data: { name: file.name, size: file.size, progress: (offset / file.size * 100).toFixed(1) } };
                onProgress(JSON.stringify(meta));

                if (offset < file.size) {
                    readSlice(offset);
                } else {
                    const doneMeta = { type: FILE_DONE, data: { name: file.name, size: file.size, progress: 100 } };
                    onProgress(JSON.stringify(doneMeta));
                }
            };

            setTimeout(sendChunk, 50);
        };

        const readSlice = offset => {
            const slice = file.slice(offset, offset + chunkSize);
            reader.readAsArrayBuffer(slice);
        };

        readSlice(offset);
    }


    return sendFile
}