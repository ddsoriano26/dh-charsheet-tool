<!-- 
Game Plan:
- Single box for upload or choose file -> accept JSON and PDF
- After uploading, a button will appear: Get Character Sheet or Get PDF
- Download after clicking
-->

<script lang="ts">
	import { extractFieldsAndValues } from './../lib/index.ts';
    import { fly, slide } from 'svelte/transition';
    type Theme = 'light' | 'dark';
    let theme = $state<Theme>('dark');

    $effect(() => {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        theme = prefersDark ? 'dark' : 'light';
    });

    let isHovered = $state(false);
    let fileName = $state('');
    let fileExt = $state('');
    let isValid = $state(false);

    function toggleTheme() {
        const root = document.documentElement;
        if (theme === 'light') {
            theme = 'dark';
            root.classList.remove('light');
            root.classList.add('dark');
        } else {
            theme = 'light';
            root.classList.remove('dark');
            root.classList.add('light');
        }
    }

    function handleDragOver(e: DragEvent) {
        e.preventDefault(); 
        isHovered = true;
    }

    function handleDragLeave() {
        isHovered = false;
    }

    function handleDrop(e: DragEvent) {
        e.preventDefault();
        isHovered = false;
        const droppedFiles = e?.dataTransfer?.files;
        if (droppedFiles) {
            files = droppedFiles
            handleInputFiles()
        }
    }

    // Declare your reactive state and element references
    let fileInput = $state<HTMLInputElement | null>(null);
    let files = $state<FileList | null>(null);

    function triggerFilePicker() {
        // Programmatically trigger the hidden input click
        fileInput?.click();
    }

    function handleInputFiles() {
        if (files) {
            fileName = files[0].name
            const currentFileExt = fileName.split('.').at(-1)
            if (currentFileExt === "json" || currentFileExt === "pdf") {
                fileExt = currentFileExt
                isValid = true
            } else {
                fileExt = ''
                isValid = false
            }
        }
    }

    async function jsonToPdf() {
        if (files) {
            const file = files[0]
            const text = await file.text()
            console.log(JSON.parse(text))
            console.log(JSON.parse(text).items)
        }
    }

    async function pdfToJson() {
        if (files) {
            // const pdfBuffer = await getPdfBuffer(files[0]);
            const file = files[0]
            const pdfBuffer = await file.arrayBuffer()
            if (pdfBuffer) {
                const formFields = await extractFieldsAndValues(pdfBuffer)
                // console.log(formFields)
                // let allEntries = Object.entries(formFields)
                let sortedEntries = formFields.sort((a,b) => a.name.localeCompare(b.name))
                console.log(sortedEntries)
                // let obj = Object.fromEntries(sortedEntries)
                // console.log(obj)
            }
        }
    }

</script>

<style>

    .dropzone-container {
        font-family: sans-serif;
        height: 100vh;
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;
        gap: 50px;
        background-color: var(--bg-page);
        color: var(--text-primary);
        transition: background-color 0.3s ease, color 0.3s ease;
    }

    .drop-zone {
        width: 40vw;
        height: 10vh;
        background: var(--bg-dropzone);
        border-radius: 20px;
        display: flex;
        justify-content: center;
        align-items: center;
        border: 2px dashed var(--border-dropzone);
        transition: transform 0.45s cubic-bezier(0.34, 1.2, 0.64, 1),
                    background 0.3s ease,
                    border-color 0.3s ease;

        &:hover {
            background: var(--bg-dropzone-hover);
            border-color: var(--border-hover);
            cursor: pointer;
            color: var(--text-primary);
        }
    }

    :global(.drop-zone__over) {
        background: var(--bg-dropzone-hover) !important;
        border-color: var(--border-hover) !important;
    }

    :global(.drop-zone__lifted) {
        transform: translateY(-1.5rem);
    }

    .drop-zone__input {
        display: none;
    }

    .file-item {
        background: transparent;
        padding: 8px;
        margin-bottom: 4px;
        border-radius: 4px;
        font-size: 14px;
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 3px;
        color: var(--text-primary);
    }

    button {
        border-radius: 10px;
        padding: 10px;
        background-color: var(--btn-bg);
        color: var(--btn-text);
        border: none;
        font-family: inherit;
        cursor: pointer;
        transition: background-color 0.2s ease, transform 0.15s ease;
    }

    button:hover {
        background-color: var(--btn-bg-hover);
        transform: translateY(-1px);
    }

    .theme-toggle {
        position: fixed;
        top: 1rem;
        right: 1rem;
        background: var(--toggle-bg);
        border: 1px solid var(--toggle-border);
        border-radius: 8px;
        padding: 6px 10px;
        font-size: 1.1rem;
        line-height: 1;
        cursor: pointer;
        transition: background 0.2s ease;
        z-index: 100;
        color: var(--text-primary);
    }

    .theme-toggle:hover {
        transform: none;
        background: var(--bg-dropzone-hover);
    }

    .title {
        font-family: 'Forum', serif;
        font-size: 2.5rem;
        font-weight: 700;
        color: var(--text-primary);
        text-align: center;
        letter-spacing: 0.05em;
        margin: 0;
        margin-bottom: 80px;
    }

</style>

<div class="dropzone-container">
    <button class="theme-toggle" onclick={toggleTheme} aria-label="Toggle theme">
        {#if theme === 'dark'}
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
        >
            <circle cx="12" cy="12" r="5"/>
            <line x1="12" y1="1" x2="12" y2="3"/>
            <line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1" y1="12" x2="3" y2="12"/>
            <line x1="21" y1="12" x2="23" y2="12"/>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
        </svg>
        {:else}
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
        >
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
        {/if}
    </button>
    <h1 class="title">Daggerheart Character Sheet Tools</h1>
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
        id="drop-zone"
        class="drop-zone"
        class:drop-zone__over={isHovered}
        class:drop-zone__lifted={!!fileExt}
        ondragover={(e) => e.preventDefault()}
        ondragenter={handleDragOver}
        ondragleave={handleDragLeave}
        ondrop={handleDrop}
        onclick={triggerFilePicker}
    >
        <div class="drop-zone__prompt">
            {#if fileName.length === 0}
            <p transition:slide={{ duration: 300 }}>Drag & drop file or click to upload</p>
            {:else if fileName.length > 0 && isValid}
            <div class="file-item" transition:slide={{ duration: 300 }}>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    height="24px"
                    viewBox="0 -960 960 960"
                    width="24px"
                    fill="currentColor"
                >
                    <path d="M720-330q0 104-73 177T470-80q-104 0-177-73t-73-177v-370q0-75 52.5-127.5T400-880q75 0 127.5 52.5T580-700v350q0 46-32 78t-78 32q-46 0-78-32t-32-78v-370h80v370q0 13 8.5 21.5T470-320q13 0 21.5-8.5T500-350v-350q-1-42-29.5-71T400-800q-42 0-71 29t-29 71v370q-1 71 49 120.5T470-160q70 0 119-49.5T640-330v-390h80v390Z"/>
                </svg>
                <p>{fileName}</p>
            </div>
            {:else}
            <div class="file-item" transition:slide={{ duration: 300 }}>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    height="24px"
                    viewBox="0 -960 960 960"
                    width="24px"
                    fill="currentColor"
                >
                    <path d="M470-80q-104 0-177-73t-73-177v-298L56-792l56-56 736 736-56 56-123-123q-35 45-86.5 72T470-80ZM300-548v218q-1 71 49 120.5T470-160q45 0 81.5-21t59.5-56l-50-50q-15 22-38.5 34.5T470-240q-46 0-78-32t-32-78v-138l-60-60Zm140 140v58q0 13 8.5 21.5T470-320q12 0 20.5-8t9.5-20l-60-60Zm200-26v-286h80v366l-80-80ZM500-574v-126q-1-42-29.5-71T400-800q-26 0-47 12t-35 32l-57-57q25-31 61-49t78-18q75 0 127.5 52.5T580-700v206l-80-80Zm-60-146v86l-80-80v-6h80Z"/>
                </svg>
                <p>File not valid. Please upload a JSON or PDF file.</p>
            </div>
            {/if}
        </div>
        <input 
            type="file" 
            bind:this={fileInput} 
            bind:files={files} 
            class="drop-zone__input"
            accept=".json,.pdf"
            onchange={handleInputFiles}
        />
    </div>
    <div class="button-container">
        {#if fileExt === "json"}
        <div transition:fly={{ y: 20, duration: 400 }}>
            <button onclick={jsonToPdf}>Generate Daggerheart Character Sheet</button>
        </div>
        {:else if fileExt === "pdf"}
        <div transition:fly={{ y: 20, duration: 400 }}>
            <button onclick={pdfToJson}>Convert PDF to Foundryborne JSON</button>
        </div>
        {/if}
    </div>
</div>