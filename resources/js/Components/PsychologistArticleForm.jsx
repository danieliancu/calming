import { Link, useForm } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { FiBold, FiItalic, FiList, FiScissors, FiType, FiUnderline } from '@/lib/icons';

const MAX_FILE_SIZE_MB = 5;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
const MAX_IMAGE_WIDTH_PX = 1200;
const WEBP_EXPORT_QUALITY = 0.8;

function stripHtml(html) {
    return html.replace(/<[^>]*>/g, ' ');
}

function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result?.toString() ?? '');
        reader.onerror = () => reject(new Error('Nu am putut citi imaginea selectata.'));
        reader.readAsDataURL(file);
    });
}

function loadImage(dataUrl) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('Nu am putut procesa imaginea selectata.'));
        image.src = dataUrl;
    });
}

function canvasToBlob(canvas, type, quality) {
    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (!blob) {
                reject(new Error('Nu am putut pregati imaginea pentru upload.'));
                return;
            }

            resolve(blob);
        }, type, quality);
    });
}

async function normalizeImageFile(file) {
    const sourceDataUrl = await readFileAsDataUrl(file);
    const image = await loadImage(sourceDataUrl);
    const targetWidth = Math.min(image.naturalWidth || image.width, MAX_IMAGE_WIDTH_PX);
    const ratio = targetWidth / Math.max(1, image.naturalWidth || image.width);
    const targetHeight = Math.max(1, Math.round((image.naturalHeight || image.height) * ratio));
    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const context = canvas.getContext('2d');
    if (!context) {
        throw new Error('Editorul nu a putut pregati imaginea pentru upload.');
    }

    context.drawImage(image, 0, 0, targetWidth, targetHeight);

    const exportType = 'image/webp';
    const blob = await canvasToBlob(canvas, exportType, WEBP_EXPORT_QUALITY);
    const extension = 'webp';
    const normalizedFile = new File([blob], file.name.replace(/\.[^.]+$/, '') + `.${extension}`, { type: exportType });
    const preview = canvas.toDataURL(exportType, WEBP_EXPORT_QUALITY);

    return {
        file: normalizedFile,
        preview,
    };
}

export default function PsychologistArticleForm({
    article = null,
    topics = [],
    submitRoute,
    method = 'post',
    title,
    description,
    submitLabel,
    backHref = null,
    cancelHref = null,
    authorNameEnabled = false,
    authorNameLabel = 'Nume autor',
}) {
    const editorRef = useRef(null);
    const editorWrapperRef = useRef(null);
    const toolbarRef = useRef(null);
    const form = useForm({
        author_name: article?.author_name ?? '',
        title: article?.title ?? '',
        tag: article?.tag ?? '',
        topic_id: article?.topic_id?.toString() ?? topics[0]?.id?.toString() ?? '',
        body: article?.body ?? '',
        hero_image: null,
    });
    const [editorHtml, setEditorHtml] = useState(article?.body ?? '');
    const [imagePreview, setImagePreview] = useState(article?.hero_image ?? null);
    const [localError, setLocalError] = useState(null);
    const [toolbarState, setToolbarState] = useState({
        bold: false,
        italic: false,
        underline: false,
        strike: false,
        heading: false,
        unorderedList: false,
    });
    const [toolbarFixedStyle, setToolbarFixedStyle] = useState(null);
    const [toolbarHeight, setToolbarHeight] = useState(0);

    const editorDisabled = topics.length === 0 || form.processing;

    useEffect(() => {
        if (editorRef.current) {
            editorRef.current.innerHTML = article?.body ?? '';
        }
    }, [article?.body]);

    useEffect(() => {
        const handleSelectionChange = () => {
            if (typeof window === 'undefined') {
                return;
            }

            const selection = window.getSelection();
            if (!selection?.anchorNode || !editorRef.current?.contains(selection.anchorNode)) {
                return;
            }

            const block = document.queryCommandValue('formatBlock')?.toLowerCase();
            setToolbarState({
                bold: document.queryCommandState('bold'),
                italic: document.queryCommandState('italic'),
                underline: document.queryCommandState('underline'),
                strike: document.queryCommandState('strikeThrough'),
                heading: block === 'h3',
                unorderedList: document.queryCommandState('insertUnorderedList'),
            });
        };

        document.addEventListener('selectionchange', handleSelectionChange);

        return () => document.removeEventListener('selectionchange', handleSelectionChange);
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return undefined;
        }

        const resolveHeaderOffset = () => {
            const rootStyles = window.getComputedStyle(document.documentElement);
            const headerVar = Number.parseFloat(rootStyles.getPropertyValue('--header-height')) || 0;
            const siteHeader = document.querySelector('.site-header');
            const headerHeight = siteHeader instanceof HTMLElement ? siteHeader.getBoundingClientRect().height : headerVar;

            return Math.ceil(headerHeight + 16);
        };

        const updateToolbarPosition = () => {
            const wrapper = editorWrapperRef.current;
            const toolbar = toolbarRef.current;

            if (!wrapper || !toolbar) {
                return;
            }

            const headerOffset = resolveHeaderOffset();
            const wrapperRect = wrapper.getBoundingClientRect();
            const toolbarRect = toolbar.getBoundingClientRect();
            const wrapperStyles = window.getComputedStyle(wrapper);
            const paddingLeft = Number.parseFloat(wrapperStyles.paddingLeft) || 0;
            const paddingRight = Number.parseFloat(wrapperStyles.paddingRight) || 0;
            const nextToolbarHeight = Math.ceil(toolbarRect.height);

            if (toolbarHeight !== nextToolbarHeight) {
                setToolbarHeight(nextToolbarHeight);
            }

            const shouldFix = wrapperRect.top <= headerOffset && wrapperRect.bottom - nextToolbarHeight > headerOffset;

            if (!shouldFix) {
                setToolbarFixedStyle(null);
                return;
            }

            setToolbarFixedStyle({
                left: `${wrapperRect.left + paddingLeft}px`,
                width: `${Math.max(0, wrapperRect.width - paddingLeft - paddingRight)}px`,
                top: `${headerOffset}px`,
            });
        };

        const onFrame = () => window.requestAnimationFrame(updateToolbarPosition);

        updateToolbarPosition();
        window.addEventListener('scroll', onFrame, { passive: true });
        window.addEventListener('resize', onFrame);

        return () => {
            window.removeEventListener('scroll', onFrame);
            window.removeEventListener('resize', onFrame);
        };
    }, [toolbarHeight]);

    const applyFormat = (command, value = null) => {
        document.execCommand(command, false, value);
        editorRef.current?.focus();
        const html = editorRef.current?.innerHTML ?? '';
        setEditorHtml(html);
        form.setData('body', html);
    };

    const handleFieldChange = (event) => {
        const { name, value } = event.target;
        form.setData(name, value);
    };

    const handleEditorInput = (event) => {
        const html = event.currentTarget.innerHTML;
        setEditorHtml(html);
        form.setData('body', html);
    };

    const handleEditorPaste = (event) => {
        if (!editorRef.current) {
            return;
        }

        event.preventDefault();
        const text = event.clipboardData?.getData('text/plain') ?? '';
        document.execCommand('insertText', false, text);
        const html = editorRef.current.innerHTML;
        setEditorHtml(html);
        form.setData('body', html);
    };

    const handleFileChange = async (event) => {
        const file = event.target.files?.[0];

        if (!file) {
            form.setData('hero_image', null);
            setImagePreview(article?.hero_image ?? null);
            return;
        }

        if (!ACCEPTED_TYPES.includes(file.type)) {
            setLocalError('Imaginea trebuie sa fie JPG, PNG sau WEBP.');
            event.target.value = '';
            return;
        }

        try {
            const normalized = await normalizeImageFile(file);

            if (normalized.file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
                setLocalError(`Imaginea optimizata trebuie sa fie mai mica de ${MAX_FILE_SIZE_MB}MB.`);
                event.target.value = '';
                return;
            }

            setLocalError(null);
            form.setData('hero_image', normalized.file);
            setImagePreview(normalized.preview);
        } catch (error) {
            setLocalError(error instanceof Error ? error.message : 'Nu am putut procesa imaginea.');
            event.target.value = '';
        }
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        setLocalError(null);

        const titleValue = form.data.title.trim();
        const authorNameValue = form.data.author_name.trim();
        const tagValue = form.data.tag.trim();
        const bodyText = stripHtml(editorHtml).trim();

        if ((authorNameEnabled && !authorNameValue) || !titleValue || !tagValue || !form.data.topic_id || !bodyText) {
            setLocalError(authorNameEnabled
                ? 'Completează numele autorului, titlul, tag-ul, rubrica și conținutul articolului.'
                : 'Completează titlul, tag-ul, rubrica și conținutul articolului.');
            return;
        }

        if (!article && !form.data.hero_image) {
            setLocalError('Adaugă o imagine pentru articol.');
            return;
        }

        form.transform((data) => ({
            ...data,
            author_name: data.author_name.trim(),
            title: data.title.trim(),
            tag: data.tag.trim(),
            body: editorHtml,
            topic_id: Number(data.topic_id),
            _method: method,
        }));

        form.post(submitRoute, {
            preserveScroll: true,
            forceFormData: true,
        });
    };

    const firstError = localError ?? Object.values(form.errors)[0];

    return (
        <>
            <div className="group-convo-nav">
                <Link href={backHref ?? route('psychologists.dashboard', { section: 'articles' })} className="group-back-link">
                    &larr; Înapoi
                </Link>
            </div>
            <section className="card psych-card">
                <div className="section-title">{title}</div>
                <p className="muted">{description}</p>
                {topics.length === 0 ? (
                    <div className="info-banner u-mt-2">
                        Nu exista rubrici configurate in acest moment. Contacteaza echipa editoriala pentru a continua.
                    </div>
                ) : null}
                {firstError ? <div className="info-banner u-mt-2">{firstError}</div> : null}
                <form className="form-grid u-mt-3" onSubmit={handleSubmit}>
                    {authorNameEnabled ? (
                        <label className="span-2">
                            <span>{authorNameLabel}</span>
                            <input
                                name="author_name"
                                value={form.data.author_name}
                                onChange={handleFieldChange}
                                required
                                disabled={editorDisabled}
                            />
                        </label>
                    ) : null}

                    <label className="span-2">
                        <span>Titlu articol</span>
                        <input name="title" value={form.data.title} onChange={handleFieldChange} required disabled={editorDisabled} />
                    </label>

                    <div className="article-meta-grid span-2">
                        <label>
                            <span>Tag articol</span>
                            <input name="tag" value={form.data.tag} onChange={handleFieldChange} required disabled={editorDisabled} />
                        </label>
                        <label>
                            <span>Rubrica</span>
                            <select name="topic_id" value={form.data.topic_id} onChange={handleFieldChange} disabled={editorDisabled}>
                                {topics.map((topic) => (
                                    <option key={topic.id} value={topic.id}>
                                        {topic.name}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>

                    <div className="span-2 form-field-block">
                        <span className="field-label">Conținut</span>
                        <div className="editor-wrapper" ref={editorWrapperRef}>
                            {toolbarFixedStyle ? <div aria-hidden className="editor-toolbar-spacer" style={{ height: `${toolbarHeight}px` }} /> : null}
                            <div
                                ref={toolbarRef}
                                className={`editor-toolbar ${toolbarFixedStyle ? 'editor-toolbar--fixed' : ''}`}
                                role="toolbar"
                                aria-label="Formatare text"
                                style={toolbarFixedStyle ?? undefined}
                            >
                                <button type="button" className={toolbarState.bold ? 'active' : ''} onMouseDown={(event) => { event.preventDefault(); if (!editorDisabled) { applyFormat('bold'); } }} disabled={editorDisabled}>
                                    <FiBold />
                                </button>
                                <button type="button" className={toolbarState.italic ? 'active' : ''} onMouseDown={(event) => { event.preventDefault(); if (!editorDisabled) { applyFormat('italic'); } }} disabled={editorDisabled}>
                                    <FiItalic />
                                </button>
                                <button type="button" className={toolbarState.underline ? 'active' : ''} onMouseDown={(event) => { event.preventDefault(); if (!editorDisabled) { applyFormat('underline'); } }} disabled={editorDisabled}>
                                    <FiUnderline />
                                </button>
                                <button type="button" className={toolbarState.strike ? 'active' : ''} onMouseDown={(event) => { event.preventDefault(); if (!editorDisabled) { applyFormat('strikeThrough'); } }} disabled={editorDisabled}>
                                    <FiScissors />
                                </button>
                                <button type="button" className={toolbarState.unorderedList ? 'active' : ''} onMouseDown={(event) => { event.preventDefault(); if (!editorDisabled) { applyFormat('insertUnorderedList'); } }} disabled={editorDisabled}>
                                    <FiList />
                                </button>
                                <button type="button" className={toolbarState.heading ? 'active' : ''} onMouseDown={(event) => { event.preventDefault(); if (!editorDisabled) { applyFormat('formatBlock', 'H3'); } }} disabled={editorDisabled}>
                                    <FiType /> Intertitlu
                                </button>
                                <button type="button" onMouseDown={(event) => { event.preventDefault(); if (!editorDisabled) { applyFormat('formatBlock', 'P'); } }} disabled={editorDisabled}>
                                    Text normal
                                </button>
                            </div>
                            <div
                                className="rich-editor"
                                contentEditable={!editorDisabled}
                                ref={editorRef}
                                onInput={handleEditorInput}
                                onPaste={handleEditorPaste}
                                suppressContentEditableWarning
                                aria-label="Editor articol"
                            />
                        </div>
                    </div>

                    <label className="span-2">
                        <span>Imagine reprezentativa (imaginea va fi exportata automat in WEBP cu max 1200px latime)</span>
                        <input type="file" accept=".jpg,.jpeg,.png,.webp" onChange={handleFileChange} disabled={editorDisabled} />
                        {imagePreview ? (
                            <div className="image-preview">
                                <img src={imagePreview} alt="Previzualizare imagine articol" />
                            </div>
                        ) : null}
                    </label>

                    <div className="row article-form-actions">
                        <button className="btn primary" type="submit" disabled={editorDisabled}>
                            {form.processing ? 'Se trimite...' : submitLabel}
                        </button>
                        <Link className="btn" href={cancelHref ?? route('psychologists.dashboard', { section: 'articles' })}>
                            Renunță
                        </Link>
                    </div>
                </form>
            </section>
        </>
    );
}
