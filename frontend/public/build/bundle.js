
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function (fetch) {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        if (node.parentNode) {
            node.parentNode.removeChild(node);
        }
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function to_number(value) {
        return value === '' ? null : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        if (value == null) {
            node.style.removeProperty(key);
        }
        else {
            node.style.setProperty(key, value, important ? 'important' : '');
        }
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    /**
     * The `onMount` function schedules a callback to run as soon as the component has been mounted to the DOM.
     * It must be called during the component's initialisation (but doesn't need to live *inside* the component;
     * it can be called from an external module).
     *
     * `onMount` does not run inside a [server-side component](/docs#run-time-server-side-component-api).
     *
     * https://svelte.dev/docs#run-time-svelte-onmount
     */
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    /**
     * Schedules a callback to run immediately after the component has been updated.
     *
     * The first time the callback runs will be after the initial `onMount`
     */
    function afterUpdate(fn) {
        get_current_component().$$.after_update.push(fn);
    }
    /**
     * Schedules a callback to run immediately before the component is unmounted.
     *
     * Out of `onMount`, `beforeUpdate`, `afterUpdate` and `onDestroy`, this is the
     * only one that runs inside a server-side component.
     *
     * https://svelte.dev/docs#run-time-svelte-ondestroy
     */
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }
    /**
     * Creates an event dispatcher that can be used to dispatch [component events](/docs#template-syntax-component-directives-on-eventname).
     * Event dispatchers are functions that can take two arguments: `name` and `detail`.
     *
     * Component events created with `createEventDispatcher` create a
     * [CustomEvent](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent).
     * These events do not [bubble](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/Events#Event_bubbling_and_capture).
     * The `detail` argument corresponds to the [CustomEvent.detail](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/detail)
     * property and can contain any type of data.
     *
     * https://svelte.dev/docs#run-time-svelte-createeventdispatcher
     */
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail, { cancelable = false } = {}) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail, { cancelable });
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
                return !event.defaultPrevented;
            }
            return true;
        };
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            // @ts-ignore
            callbacks.slice().forEach(fn => fn.call(this, event));
        }
    }

    const dirty_components = [];
    const binding_callbacks = [];
    let render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = /* @__PURE__ */ Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function tick() {
        schedule_update();
        return resolved_promise;
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        // Do not reenter flush while dirty components are updated, as this can
        // result in an infinite loop. Instead, let the inner flush handle it.
        // Reentrancy is ok afterwards for bindings etc.
        if (flushidx !== 0) {
            return;
        }
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            try {
                while (flushidx < dirty_components.length) {
                    const component = dirty_components[flushidx];
                    flushidx++;
                    set_current_component(component);
                    update(component.$$);
                }
            }
            catch (e) {
                // reset dirty state to not end up in a deadlocked state and then rethrow
                dirty_components.length = 0;
                flushidx = 0;
                throw e;
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    /**
     * Useful for example to execute remaining `afterUpdate` callbacks before executing `destroy`.
     */
    function flush_render_callbacks(fns) {
        const filtered = [];
        const targets = [];
        render_callbacks.forEach((c) => fns.indexOf(c) === -1 ? filtered.push(c) : targets.push(c));
        targets.forEach((c) => c());
        render_callbacks = filtered;
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
        else if (callback) {
            callback();
        }
    }

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function get_spread_object(spread_props) {
        return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
    }

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
                // if the component was destroyed immediately
                // it will update the `$$.on_destroy` reference to `null`.
                // the destructured on_destroy may still reference to the old array
                if (component.$$.on_destroy) {
                    component.$$.on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            flush_render_callbacks($$.after_update);
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: [],
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            if (!is_function(callback)) {
                return noop;
            }
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.59.2' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation, has_stop_immediate_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        if (has_stop_immediate_propagation)
            modifiers.push('stopImmediatePropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    function construct_svelte_component_dev(component, props) {
        const error_message = 'this={...} of <svelte:component> should specify a Svelte component.';
        try {
            const instance = new component(props);
            if (!instance.$$ || !instance.$set || !instance.$on || !instance.$destroy) {
                throw new Error(error_message);
            }
            return instance;
        }
        catch (err) {
            const { message } = err;
            if (typeof message === 'string' && message.indexOf('is not a constructor') !== -1) {
                throw new Error(error_message);
            }
            else {
                throw err;
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier} [start]
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=} start
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0 && stop) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }
    function derived(stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single
            ? [stores]
            : stores;
        const auto = fn.length < 2;
        return readable(initial_value, (set) => {
            let started = false;
            const values = [];
            let pending = 0;
            let cleanup = noop;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup();
                const result = fn(single ? values[0] : values, set);
                if (auto) {
                    set(result);
                }
                else {
                    cleanup = is_function(result) ? result : noop;
                }
            };
            const unsubscribers = stores_array.map((store, i) => subscribe(store, (value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (started) {
                    sync();
                }
            }, () => {
                pending |= (1 << i);
            }));
            started = true;
            sync();
            return function stop() {
                run_all(unsubscribers);
                cleanup();
                // We need to set this to false because callbacks can still happen despite having unsubscribed:
                // Callbacks might already be placed in the queue which doesn't know it should no longer
                // invoke this derived store.
                started = false;
            };
        });
    }

    function parse(str, loose) {
    	if (str instanceof RegExp) return { keys:false, pattern:str };
    	var c, o, tmp, ext, keys=[], pattern='', arr = str.split('/');
    	arr[0] || arr.shift();

    	while (tmp = arr.shift()) {
    		c = tmp[0];
    		if (c === '*') {
    			keys.push('wild');
    			pattern += '/(.*)';
    		} else if (c === ':') {
    			o = tmp.indexOf('?', 1);
    			ext = tmp.indexOf('.', 1);
    			keys.push( tmp.substring(1, !!~o ? o : !!~ext ? ext : tmp.length) );
    			pattern += !!~o && !~ext ? '(?:/([^/]+?))?' : '/([^/]+?)';
    			if (!!~ext) pattern += (!!~o ? '?' : '') + '\\' + tmp.substring(ext);
    		} else {
    			pattern += '/' + tmp;
    		}
    	}

    	return {
    		keys: keys,
    		pattern: new RegExp('^' + pattern + (loose ? '(?=$|\/)' : '\/?$'), 'i')
    	};
    }

    /* node_modules/svelte-spa-router/Router.svelte generated by Svelte v3.59.2 */

    const { Error: Error_1, Object: Object_1, console: console_1$7 } = globals;

    // (246:0) {:else}
    function create_else_block$3(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;
    	const switch_instance_spread_levels = [/*props*/ ctx[2]];
    	var switch_value = /*component*/ ctx[0];

    	function switch_props(ctx) {
    		let switch_instance_props = {};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = construct_svelte_component_dev(switch_value, switch_props());
    		switch_instance.$on("routeEvent", /*routeEvent_handler_1*/ ctx[7]);
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) mount_component(switch_instance, target, anchor);
    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = (dirty & /*props*/ 4)
    			? get_spread_update(switch_instance_spread_levels, [get_spread_object(/*props*/ ctx[2])])
    			: {};

    			if (dirty & /*component*/ 1 && switch_value !== (switch_value = /*component*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = construct_svelte_component_dev(switch_value, switch_props());
    					switch_instance.$on("routeEvent", /*routeEvent_handler_1*/ ctx[7]);
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$3.name,
    		type: "else",
    		source: "(246:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (239:0) {#if componentParams}
    function create_if_block$5(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;
    	const switch_instance_spread_levels = [{ params: /*componentParams*/ ctx[1] }, /*props*/ ctx[2]];
    	var switch_value = /*component*/ ctx[0];

    	function switch_props(ctx) {
    		let switch_instance_props = {};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = construct_svelte_component_dev(switch_value, switch_props());
    		switch_instance.$on("routeEvent", /*routeEvent_handler*/ ctx[6]);
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) mount_component(switch_instance, target, anchor);
    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = (dirty & /*componentParams, props*/ 6)
    			? get_spread_update(switch_instance_spread_levels, [
    					dirty & /*componentParams*/ 2 && { params: /*componentParams*/ ctx[1] },
    					dirty & /*props*/ 4 && get_spread_object(/*props*/ ctx[2])
    				])
    			: {};

    			if (dirty & /*component*/ 1 && switch_value !== (switch_value = /*component*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = construct_svelte_component_dev(switch_value, switch_props());
    					switch_instance.$on("routeEvent", /*routeEvent_handler*/ ctx[6]);
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$5.name,
    		type: "if",
    		source: "(239:0) {#if componentParams}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$c(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$5, create_else_block$3];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*componentParams*/ ctx[1]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error_1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function getLocation() {
    	const hashPosition = window.location.href.indexOf('#/');

    	let location = hashPosition > -1
    	? window.location.href.substr(hashPosition + 1)
    	: '/';

    	// Check if there's a querystring
    	const qsPosition = location.indexOf('?');

    	let querystring = '';

    	if (qsPosition > -1) {
    		querystring = location.substr(qsPosition + 1);
    		location = location.substr(0, qsPosition);
    	}

    	return { location, querystring };
    }

    const loc = readable(null, // eslint-disable-next-line prefer-arrow-callback
    function start(set) {
    	set(getLocation());

    	const update = () => {
    		set(getLocation());
    	};

    	window.addEventListener('hashchange', update, false);

    	return function stop() {
    		window.removeEventListener('hashchange', update, false);
    	};
    });

    const location = derived(loc, _loc => _loc.location);
    const querystring = derived(loc, _loc => _loc.querystring);
    const params = writable(undefined);

    async function push(location) {
    	if (!location || location.length < 1 || location.charAt(0) != '/' && location.indexOf('#/') !== 0) {
    		throw Error('Invalid parameter location');
    	}

    	// Execute this code when the current call stack is complete
    	await tick();

    	// Note: this will include scroll state in history even when restoreScrollState is false
    	history.replaceState(
    		{
    			...history.state,
    			__svelte_spa_router_scrollX: window.scrollX,
    			__svelte_spa_router_scrollY: window.scrollY
    		},
    		undefined
    	);

    	window.location.hash = (location.charAt(0) == '#' ? '' : '#') + location;
    }

    async function pop() {
    	// Execute this code when the current call stack is complete
    	await tick();

    	window.history.back();
    }

    async function replace(location) {
    	if (!location || location.length < 1 || location.charAt(0) != '/' && location.indexOf('#/') !== 0) {
    		throw Error('Invalid parameter location');
    	}

    	// Execute this code when the current call stack is complete
    	await tick();

    	const dest = (location.charAt(0) == '#' ? '' : '#') + location;

    	try {
    		const newState = { ...history.state };
    		delete newState['__svelte_spa_router_scrollX'];
    		delete newState['__svelte_spa_router_scrollY'];
    		window.history.replaceState(newState, undefined, dest);
    	} catch(e) {
    		// eslint-disable-next-line no-console
    		console.warn('Caught exception while replacing the current page. If you\'re running this in the Svelte REPL, please note that the `replace` method might not work in this environment.');
    	}

    	// The method above doesn't trigger the hashchange event, so let's do that manually
    	window.dispatchEvent(new Event('hashchange'));
    }

    function link(node, opts) {
    	opts = linkOpts(opts);

    	// Only apply to <a> tags
    	if (!node || !node.tagName || node.tagName.toLowerCase() != 'a') {
    		throw Error('Action "link" can only be used with <a> tags');
    	}

    	updateLink(node, opts);

    	return {
    		update(updated) {
    			updated = linkOpts(updated);
    			updateLink(node, updated);
    		}
    	};
    }

    function restoreScroll(state) {
    	// If this exists, then this is a back navigation: restore the scroll position
    	if (state) {
    		window.scrollTo(state.__svelte_spa_router_scrollX, state.__svelte_spa_router_scrollY);
    	} else {
    		// Otherwise this is a forward navigation: scroll to top
    		window.scrollTo(0, 0);
    	}
    }

    // Internal function used by the link function
    function updateLink(node, opts) {
    	let href = opts.href || node.getAttribute('href');

    	// Destination must start with '/' or '#/'
    	if (href && href.charAt(0) == '/') {
    		// Add # to the href attribute
    		href = '#' + href;
    	} else if (!href || href.length < 2 || href.slice(0, 2) != '#/') {
    		throw Error('Invalid value for "href" attribute: ' + href);
    	}

    	node.setAttribute('href', href);

    	node.addEventListener('click', event => {
    		// Prevent default anchor onclick behaviour
    		event.preventDefault();

    		if (!opts.disabled) {
    			scrollstateHistoryHandler(event.currentTarget.getAttribute('href'));
    		}
    	});
    }

    // Internal function that ensures the argument of the link action is always an object
    function linkOpts(val) {
    	if (val && typeof val == 'string') {
    		return { href: val };
    	} else {
    		return val || {};
    	}
    }

    /**
     * The handler attached to an anchor tag responsible for updating the
     * current history state with the current scroll state
     *
     * @param {string} href - Destination
     */
    function scrollstateHistoryHandler(href) {
    	// Setting the url (3rd arg) to href will break clicking for reasons, so don't try to do that
    	history.replaceState(
    		{
    			...history.state,
    			__svelte_spa_router_scrollX: window.scrollX,
    			__svelte_spa_router_scrollY: window.scrollY
    		},
    		undefined
    	);

    	// This will force an update as desired, but this time our scroll state will be attached
    	window.location.hash = href;
    }

    function instance$c($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Router', slots, []);
    	let { routes = {} } = $$props;
    	let { prefix = '' } = $$props;
    	let { restoreScrollState = false } = $$props;

    	/**
     * Container for a route: path, component
     */
    	class RouteItem {
    		/**
     * Initializes the object and creates a regular expression from the path, using regexparam.
     *
     * @param {string} path - Path to the route (must start with '/' or '*')
     * @param {SvelteComponent|WrappedComponent} component - Svelte component for the route, optionally wrapped
     */
    		constructor(path, component) {
    			if (!component || typeof component != 'function' && (typeof component != 'object' || component._sveltesparouter !== true)) {
    				throw Error('Invalid component object');
    			}

    			// Path must be a regular or expression, or a string starting with '/' or '*'
    			if (!path || typeof path == 'string' && (path.length < 1 || path.charAt(0) != '/' && path.charAt(0) != '*') || typeof path == 'object' && !(path instanceof RegExp)) {
    				throw Error('Invalid value for "path" argument - strings must start with / or *');
    			}

    			const { pattern, keys } = parse(path);
    			this.path = path;

    			// Check if the component is wrapped and we have conditions
    			if (typeof component == 'object' && component._sveltesparouter === true) {
    				this.component = component.component;
    				this.conditions = component.conditions || [];
    				this.userData = component.userData;
    				this.props = component.props || {};
    			} else {
    				// Convert the component to a function that returns a Promise, to normalize it
    				this.component = () => Promise.resolve(component);

    				this.conditions = [];
    				this.props = {};
    			}

    			this._pattern = pattern;
    			this._keys = keys;
    		}

    		/**
     * Checks if `path` matches the current route.
     * If there's a match, will return the list of parameters from the URL (if any).
     * In case of no match, the method will return `null`.
     *
     * @param {string} path - Path to test
     * @returns {null|Object.<string, string>} List of paramters from the URL if there's a match, or `null` otherwise.
     */
    		match(path) {
    			// If there's a prefix, check if it matches the start of the path.
    			// If not, bail early, else remove it before we run the matching.
    			if (prefix) {
    				if (typeof prefix == 'string') {
    					if (path.startsWith(prefix)) {
    						path = path.substr(prefix.length) || '/';
    					} else {
    						return null;
    					}
    				} else if (prefix instanceof RegExp) {
    					const match = path.match(prefix);

    					if (match && match[0]) {
    						path = path.substr(match[0].length) || '/';
    					} else {
    						return null;
    					}
    				}
    			}

    			// Check if the pattern matches
    			const matches = this._pattern.exec(path);

    			if (matches === null) {
    				return null;
    			}

    			// If the input was a regular expression, this._keys would be false, so return matches as is
    			if (this._keys === false) {
    				return matches;
    			}

    			const out = {};
    			let i = 0;

    			while (i < this._keys.length) {
    				// In the match parameters, URL-decode all values
    				try {
    					out[this._keys[i]] = decodeURIComponent(matches[i + 1] || '') || null;
    				} catch(e) {
    					out[this._keys[i]] = null;
    				}

    				i++;
    			}

    			return out;
    		}

    		/**
     * Dictionary with route details passed to the pre-conditions functions, as well as the `routeLoading`, `routeLoaded` and `conditionsFailed` events
     * @typedef {Object} RouteDetail
     * @property {string|RegExp} route - Route matched as defined in the route definition (could be a string or a reguar expression object)
     * @property {string} location - Location path
     * @property {string} querystring - Querystring from the hash
     * @property {object} [userData] - Custom data passed by the user
     * @property {SvelteComponent} [component] - Svelte component (only in `routeLoaded` events)
     * @property {string} [name] - Name of the Svelte component (only in `routeLoaded` events)
     */
    		/**
     * Executes all conditions (if any) to control whether the route can be shown. Conditions are executed in the order they are defined, and if a condition fails, the following ones aren't executed.
     * 
     * @param {RouteDetail} detail - Route detail
     * @returns {boolean} Returns true if all the conditions succeeded
     */
    		async checkConditions(detail) {
    			for (let i = 0; i < this.conditions.length; i++) {
    				if (!await this.conditions[i](detail)) {
    					return false;
    				}
    			}

    			return true;
    		}
    	}

    	// Set up all routes
    	const routesList = [];

    	if (routes instanceof Map) {
    		// If it's a map, iterate on it right away
    		routes.forEach((route, path) => {
    			routesList.push(new RouteItem(path, route));
    		});
    	} else {
    		// We have an object, so iterate on its own properties
    		Object.keys(routes).forEach(path => {
    			routesList.push(new RouteItem(path, routes[path]));
    		});
    	}

    	// Props for the component to render
    	let component = null;

    	let componentParams = null;
    	let props = {};

    	// Event dispatcher from Svelte
    	const dispatch = createEventDispatcher();

    	// Just like dispatch, but executes on the next iteration of the event loop
    	async function dispatchNextTick(name, detail) {
    		// Execute this code when the current call stack is complete
    		await tick();

    		dispatch(name, detail);
    	}

    	// If this is set, then that means we have popped into this var the state of our last scroll position
    	let previousScrollState = null;

    	let popStateChanged = null;

    	if (restoreScrollState) {
    		popStateChanged = event => {
    			// If this event was from our history.replaceState, event.state will contain
    			// our scroll history. Otherwise, event.state will be null (like on forward
    			// navigation)
    			if (event.state && (event.state.__svelte_spa_router_scrollY || event.state.__svelte_spa_router_scrollX)) {
    				previousScrollState = event.state;
    			} else {
    				previousScrollState = null;
    			}
    		};

    		// This is removed in the destroy() invocation below
    		window.addEventListener('popstate', popStateChanged);

    		afterUpdate(() => {
    			restoreScroll(previousScrollState);
    		});
    	}

    	// Always have the latest value of loc
    	let lastLoc = null;

    	// Current object of the component loaded
    	let componentObj = null;

    	// Handle hash change events
    	// Listen to changes in the $loc store and update the page
    	// Do not use the $: syntax because it gets triggered by too many things
    	const unsubscribeLoc = loc.subscribe(async newLoc => {
    		lastLoc = newLoc;

    		// Find a route matching the location
    		let i = 0;

    		while (i < routesList.length) {
    			const match = routesList[i].match(newLoc.location);

    			if (!match) {
    				i++;
    				continue;
    			}

    			const detail = {
    				route: routesList[i].path,
    				location: newLoc.location,
    				querystring: newLoc.querystring,
    				userData: routesList[i].userData,
    				params: match && typeof match == 'object' && Object.keys(match).length
    				? match
    				: null
    			};

    			// Check if the route can be loaded - if all conditions succeed
    			if (!await routesList[i].checkConditions(detail)) {
    				// Don't display anything
    				$$invalidate(0, component = null);

    				componentObj = null;

    				// Trigger an event to notify the user, then exit
    				dispatchNextTick('conditionsFailed', detail);

    				return;
    			}

    			// Trigger an event to alert that we're loading the route
    			// We need to clone the object on every event invocation so we don't risk the object to be modified in the next tick
    			dispatchNextTick('routeLoading', Object.assign({}, detail));

    			// If there's a component to show while we're loading the route, display it
    			const obj = routesList[i].component;

    			// Do not replace the component if we're loading the same one as before, to avoid the route being unmounted and re-mounted
    			if (componentObj != obj) {
    				if (obj.loading) {
    					$$invalidate(0, component = obj.loading);
    					componentObj = obj;
    					$$invalidate(1, componentParams = obj.loadingParams);
    					$$invalidate(2, props = {});

    					// Trigger the routeLoaded event for the loading component
    					// Create a copy of detail so we don't modify the object for the dynamic route (and the dynamic route doesn't modify our object too)
    					dispatchNextTick('routeLoaded', Object.assign({}, detail, {
    						component,
    						name: component.name,
    						params: componentParams
    					}));
    				} else {
    					$$invalidate(0, component = null);
    					componentObj = null;
    				}

    				// Invoke the Promise
    				const loaded = await obj();

    				// Now that we're here, after the promise resolved, check if we still want this component, as the user might have navigated to another page in the meanwhile
    				if (newLoc != lastLoc) {
    					// Don't update the component, just exit
    					return;
    				}

    				// If there is a "default" property, which is used by async routes, then pick that
    				$$invalidate(0, component = loaded && loaded.default || loaded);

    				componentObj = obj;
    			}

    			// Set componentParams only if we have a match, to avoid a warning similar to `<Component> was created with unknown prop 'params'`
    			// Of course, this assumes that developers always add a "params" prop when they are expecting parameters
    			if (match && typeof match == 'object' && Object.keys(match).length) {
    				$$invalidate(1, componentParams = match);
    			} else {
    				$$invalidate(1, componentParams = null);
    			}

    			// Set static props, if any
    			$$invalidate(2, props = routesList[i].props);

    			// Dispatch the routeLoaded event then exit
    			// We need to clone the object on every event invocation so we don't risk the object to be modified in the next tick
    			dispatchNextTick('routeLoaded', Object.assign({}, detail, {
    				component,
    				name: component.name,
    				params: componentParams
    			})).then(() => {
    				params.set(componentParams);
    			});

    			return;
    		}

    		// If we're still here, there was no match, so show the empty component
    		$$invalidate(0, component = null);

    		componentObj = null;
    		params.set(undefined);
    	});

    	onDestroy(() => {
    		unsubscribeLoc();
    		popStateChanged && window.removeEventListener('popstate', popStateChanged);
    	});

    	const writable_props = ['routes', 'prefix', 'restoreScrollState'];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$7.warn(`<Router> was created with unknown prop '${key}'`);
    	});

    	function routeEvent_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function routeEvent_handler_1(event) {
    		bubble.call(this, $$self, event);
    	}

    	$$self.$$set = $$props => {
    		if ('routes' in $$props) $$invalidate(3, routes = $$props.routes);
    		if ('prefix' in $$props) $$invalidate(4, prefix = $$props.prefix);
    		if ('restoreScrollState' in $$props) $$invalidate(5, restoreScrollState = $$props.restoreScrollState);
    	};

    	$$self.$capture_state = () => ({
    		readable,
    		writable,
    		derived,
    		tick,
    		getLocation,
    		loc,
    		location,
    		querystring,
    		params,
    		push,
    		pop,
    		replace,
    		link,
    		restoreScroll,
    		updateLink,
    		linkOpts,
    		scrollstateHistoryHandler,
    		onDestroy,
    		createEventDispatcher,
    		afterUpdate,
    		parse,
    		routes,
    		prefix,
    		restoreScrollState,
    		RouteItem,
    		routesList,
    		component,
    		componentParams,
    		props,
    		dispatch,
    		dispatchNextTick,
    		previousScrollState,
    		popStateChanged,
    		lastLoc,
    		componentObj,
    		unsubscribeLoc
    	});

    	$$self.$inject_state = $$props => {
    		if ('routes' in $$props) $$invalidate(3, routes = $$props.routes);
    		if ('prefix' in $$props) $$invalidate(4, prefix = $$props.prefix);
    		if ('restoreScrollState' in $$props) $$invalidate(5, restoreScrollState = $$props.restoreScrollState);
    		if ('component' in $$props) $$invalidate(0, component = $$props.component);
    		if ('componentParams' in $$props) $$invalidate(1, componentParams = $$props.componentParams);
    		if ('props' in $$props) $$invalidate(2, props = $$props.props);
    		if ('previousScrollState' in $$props) previousScrollState = $$props.previousScrollState;
    		if ('popStateChanged' in $$props) popStateChanged = $$props.popStateChanged;
    		if ('lastLoc' in $$props) lastLoc = $$props.lastLoc;
    		if ('componentObj' in $$props) componentObj = $$props.componentObj;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*restoreScrollState*/ 32) {
    			// Update history.scrollRestoration depending on restoreScrollState
    			history.scrollRestoration = restoreScrollState ? 'manual' : 'auto';
    		}
    	};

    	return [
    		component,
    		componentParams,
    		props,
    		routes,
    		prefix,
    		restoreScrollState,
    		routeEvent_handler,
    		routeEvent_handler_1
    	];
    }

    class Router extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$c, create_fragment$c, safe_not_equal, {
    			routes: 3,
    			prefix: 4,
    			restoreScrollState: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Router",
    			options,
    			id: create_fragment$c.name
    		});
    	}

    	get routes() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set routes(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get prefix() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set prefix(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get restoreScrollState() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set restoreScrollState(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Button.svelte generated by Svelte v3.59.2 */

    const file$a = "src/components/Button.svelte";

    function create_fragment$b(ctx) {
    	let button;
    	let t;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			t = text(/*label*/ ctx[0]);
    			attr_dev(button, "class", "bg-gradient-to-br from-[#5c4f9e] to-[#342d59] text-white py-2 px-3 rounded-md");
    			add_location(button, file$a, 4, 0, 53);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[1], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*label*/ 1) set_data_dev(t, /*label*/ ctx[0]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Button', slots, []);
    	let { label = "Button" } = $$props;
    	const writable_props = ['label'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Button> was created with unknown prop '${key}'`);
    	});

    	function click_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	$$self.$$set = $$props => {
    		if ('label' in $$props) $$invalidate(0, label = $$props.label);
    	};

    	$$self.$capture_state = () => ({ label });

    	$$self.$inject_state = $$props => {
    		if ('label' in $$props) $$invalidate(0, label = $$props.label);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [label, click_handler];
    }

    class Button extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, { label: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Button",
    			options,
    			id: create_fragment$b.name
    		});
    	}

    	get label() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set label(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/TextInput.svelte generated by Svelte v3.59.2 */

    const file$9 = "src/components/TextInput.svelte";

    function create_fragment$a(ctx) {
    	let input;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			input = element("input");
    			attr_dev(input, "class", "appearance-none border-2 border-gray-300 rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline");
    			attr_dev(input, "placeholder", /*placeholder*/ ctx[1]);
    			attr_dev(input, "type", "text");
    			input.disabled = /*disabled*/ ctx[2];
    			add_location(input, file$9, 6, 0, 108);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    			set_input_value(input, /*value*/ ctx[0]);

    			if (!mounted) {
    				dispose = listen_dev(input, "input", /*input_input_handler*/ ctx[3]);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*placeholder*/ 2) {
    				attr_dev(input, "placeholder", /*placeholder*/ ctx[1]);
    			}

    			if (dirty & /*disabled*/ 4) {
    				prop_dev(input, "disabled", /*disabled*/ ctx[2]);
    			}

    			if (dirty & /*value*/ 1 && input.value !== /*value*/ ctx[0]) {
    				set_input_value(input, /*value*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('TextInput', slots, []);
    	let { value = "" } = $$props;
    	let { placeholder } = $$props;
    	let { disabled = false } = $$props;

    	$$self.$$.on_mount.push(function () {
    		if (placeholder === undefined && !('placeholder' in $$props || $$self.$$.bound[$$self.$$.props['placeholder']])) {
    			console.warn("<TextInput> was created without expected prop 'placeholder'");
    		}
    	});

    	const writable_props = ['value', 'placeholder', 'disabled'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<TextInput> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		value = this.value;
    		$$invalidate(0, value);
    	}

    	$$self.$$set = $$props => {
    		if ('value' in $$props) $$invalidate(0, value = $$props.value);
    		if ('placeholder' in $$props) $$invalidate(1, placeholder = $$props.placeholder);
    		if ('disabled' in $$props) $$invalidate(2, disabled = $$props.disabled);
    	};

    	$$self.$capture_state = () => ({ value, placeholder, disabled });

    	$$self.$inject_state = $$props => {
    		if ('value' in $$props) $$invalidate(0, value = $$props.value);
    		if ('placeholder' in $$props) $$invalidate(1, placeholder = $$props.placeholder);
    		if ('disabled' in $$props) $$invalidate(2, disabled = $$props.disabled);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [value, placeholder, disabled, input_input_handler];
    }

    class TextInput extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, { value: 0, placeholder: 1, disabled: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TextInput",
    			options,
    			id: create_fragment$a.name
    		});
    	}

    	get value() {
    		throw new Error("<TextInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<TextInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get placeholder() {
    		throw new Error("<TextInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set placeholder(value) {
    		throw new Error("<TextInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disabled() {
    		throw new Error("<TextInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<TextInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/PasswordInput.svelte generated by Svelte v3.59.2 */

    const { console: console_1$6 } = globals;
    const file$8 = "src/components/PasswordInput.svelte";

    function create_fragment$9(ctx) {
    	let input;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			input = element("input");
    			attr_dev(input, "class", "appearance-none border-2 border-gray-300 rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline");
    			attr_dev(input, "placeholder", "Password");
    			attr_dev(input, "type", "password");
    			input.disabled = /*disabled*/ ctx[1];
    			add_location(input, file$8, 27, 0, 542);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    			set_input_value(input, /*value*/ ctx[0]);
    			/*input_binding*/ ctx[5](input);

    			if (!mounted) {
    				dispose = listen_dev(input, "input", /*input_input_handler*/ ctx[4]);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*disabled*/ 2) {
    				prop_dev(input, "disabled", /*disabled*/ ctx[1]);
    			}

    			if (dirty & /*value*/ 1 && input.value !== /*value*/ ctx[0]) {
    				set_input_value(input, /*value*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input);
    			/*input_binding*/ ctx[5](null);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('PasswordInput', slots, []);
    	let { value = "" } = $$props;
    	let { disabled = false } = $$props;
    	let { show = false } = $$props;
    	let inputElement;

    	onMount(() => {
    		$$invalidate(2, inputElement.type = "password", inputElement);
    	});

    	function updateType() {
    		if (!inputElement) {
    			return;
    		}

    		console.log("Showing password: " + show);

    		if (show) {
    			$$invalidate(2, inputElement.type = "text", inputElement);
    		} else {
    			$$invalidate(2, inputElement.type = "password", inputElement);
    		}
    	}

    	const writable_props = ['value', 'disabled', 'show'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$6.warn(`<PasswordInput> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		value = this.value;
    		$$invalidate(0, value);
    	}

    	function input_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			inputElement = $$value;
    			$$invalidate(2, inputElement);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ('value' in $$props) $$invalidate(0, value = $$props.value);
    		if ('disabled' in $$props) $$invalidate(1, disabled = $$props.disabled);
    		if ('show' in $$props) $$invalidate(3, show = $$props.show);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		value,
    		disabled,
    		show,
    		inputElement,
    		updateType
    	});

    	$$self.$inject_state = $$props => {
    		if ('value' in $$props) $$invalidate(0, value = $$props.value);
    		if ('disabled' in $$props) $$invalidate(1, disabled = $$props.disabled);
    		if ('show' in $$props) $$invalidate(3, show = $$props.show);
    		if ('inputElement' in $$props) $$invalidate(2, inputElement = $$props.inputElement);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*show*/ 8) {
    			(updateType());
    		}
    	};

    	return [value, disabled, inputElement, show, input_input_handler, input_binding];
    }

    class PasswordInput extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, { value: 0, disabled: 1, show: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "PasswordInput",
    			options,
    			id: create_fragment$9.name
    		});
    	}

    	get value() {
    		throw new Error("<PasswordInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<PasswordInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disabled() {
    		throw new Error("<PasswordInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<PasswordInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get show() {
    		throw new Error("<PasswordInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set show(value) {
    		throw new Error("<PasswordInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/svelte-cookie/src/SvelteCookie.svelte generated by Svelte v3.59.2 */

    function getCookie$1(name) {
    	let cookieName = name + "=";
    	let decodedCookie = decodeURIComponent(document.cookie);
    	let ca = decodedCookie.split(';');

    	for (let i = 0; i < ca.length; i++) {
    		let c = ca[i];

    		while (c.charAt(0) == ' ') {
    			c = c.substring(1);
    		}

    		if (c.indexOf(cookieName) == 0) {
    			return c.substring(cookieName.length, c.length);
    		}
    	}

    	return "";
    }

    function setCookie(name, value, exdays, secure) {
    	const d = new Date();
    	d.setTime(d.getTime() + exdays * 24 * 60 * 60 * 1000);
    	let expires = "expires=" + d.toUTCString();

    	if (secure) {
    		document.cookie = name + "=" + value + ";" + expires + ";path=/; secure";
    	} else {
    		document.cookie = name + "=" + value + ";" + expires + ";path=/";
    	}
    }

    function deleteCookie$1(name) {
    	document.cookie = name + '=; Max-Age=-99999999;';
    }

    /* src/pages/LandingPage.svelte generated by Svelte v3.59.2 */

    const { console: console_1$5 } = globals;
    const file$7 = "src/pages/LandingPage.svelte";

    // (227:25) 
    function create_if_block_2$2(ctx) {
    	let div3;
    	let div2;
    	let div0;
    	let h2;
    	let t1;
    	let p0;
    	let t2;
    	let button0;
    	let t3;
    	let p1;
    	let t4;
    	let svg;
    	let path;
    	let t5;
    	let p2;
    	let t6;
    	let textinput;
    	let updating_value;
    	let t7;
    	let p3;
    	let t8;
    	let passwordinput;
    	let updating_value_1;
    	let t9;
    	let p4;
    	let t10;
    	let button1;
    	let t11;
    	let t12;
    	let p5;
    	let t13;
    	let div1;
    	let t14;
    	let t15_value = " " + "";
    	let t15;
    	let t16;
    	let p6;
    	let t17;
    	let button2;
    	let current;
    	let mounted;
    	let dispose;

    	function textinput_value_binding_1(value) {
    		/*textinput_value_binding_1*/ ctx[15](value);
    	}

    	let textinput_props = { placeholder: "Username" };

    	if (/*username*/ ctx[3] !== void 0) {
    		textinput_props.value = /*username*/ ctx[3];
    	}

    	textinput = new TextInput({ props: textinput_props, $$inline: true });
    	binding_callbacks.push(() => bind(textinput, 'value', textinput_value_binding_1));

    	function passwordinput_value_binding_1(value) {
    		/*passwordinput_value_binding_1*/ ctx[16](value);
    	}

    	let passwordinput_props = {};

    	if (/*password*/ ctx[4] !== void 0) {
    		passwordinput_props.value = /*password*/ ctx[4];
    	}

    	passwordinput = new PasswordInput({
    			props: passwordinput_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(passwordinput, 'value', passwordinput_value_binding_1));

    	button1 = new Button({
    			props: { label: "Login" },
    			$$inline: true
    		});

    	button1.$on("click", /*click_handler_6*/ ctx[17]);
    	let if_block = /*usernameTaken*/ ctx[2] && create_if_block_3$2(ctx);

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			h2 = element("h2");
    			h2.textContent = "Login to BrainSpark";
    			t1 = space();
    			p0 = element("p");
    			t2 = space();
    			button0 = element("button");
    			t3 = text("Close\n                        \n                        ");
    			p1 = element("p");
    			t4 = space();
    			svg = svg_element("svg");
    			path = svg_element("path");
    			t5 = space();
    			p2 = element("p");
    			t6 = space();
    			create_component(textinput.$$.fragment);
    			t7 = space();
    			p3 = element("p");
    			t8 = space();
    			create_component(passwordinput.$$.fragment);
    			t9 = space();
    			p4 = element("p");
    			t10 = space();
    			create_component(button1.$$.fragment);
    			t11 = space();
    			if (if_block) if_block.c();
    			t12 = space();
    			p5 = element("p");
    			t13 = space();
    			div1 = element("div");
    			t14 = text("Need an account?");
    			t15 = text(t15_value);
    			t16 = space();
    			p6 = element("p");
    			t17 = space();
    			button2 = element("button");
    			button2.textContent = "Sign Up";
    			attr_dev(h2, "class", "text-3xl font-bold font-vag");
    			add_location(h2, file$7, 232, 20, 8318);
    			attr_dev(p0, "class", "px-10");
    			add_location(p0, file$7, 235, 20, 8449);
    			attr_dev(p1, "class", "px-1");
    			add_location(p1, file$7, 244, 24, 8776);
    			attr_dev(path, "stroke-linecap", "round");
    			attr_dev(path, "stroke-linejoin", "round");
    			attr_dev(path, "d", "M6 18 18 6M6 6l12 12");
    			add_location(path, file$7, 253, 28, 9172);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "stroke-width", "1.5");
    			attr_dev(svg, "stroke", "currentColor");
    			attr_dev(svg, "class", "w-6 h-6");
    			add_location(svg, file$7, 245, 24, 8821);
    			attr_dev(button0, "class", "ml-auto flex");
    			add_location(button0, file$7, 236, 20, 8491);
    			attr_dev(div0, "class", "flex items-center justify-center");
    			add_location(div0, file$7, 231, 16, 8251);
    			attr_dev(p2, "class", "py-3");
    			add_location(p2, file$7, 261, 16, 9477);
    			attr_dev(p3, "class", "py-3");
    			add_location(p3, file$7, 263, 16, 9589);
    			attr_dev(p4, "class", "py-3");
    			add_location(p4, file$7, 265, 16, 9682);
    			attr_dev(p5, "class", "py-3");
    			add_location(p5, file$7, 278, 16, 10145);
    			attr_dev(p6, "class", "px-1");
    			add_location(p6, file$7, 281, 20, 10263);
    			attr_dev(button2, "class", "text-blue-500");
    			add_location(button2, file$7, 282, 20, 10304);
    			attr_dev(div1, "class", "flex");
    			add_location(div1, file$7, 279, 16, 10182);
    			attr_dev(div2, "class", "bg-white p-10 rounded-md");
    			add_location(div2, file$7, 230, 12, 8196);
    			attr_dev(div3, "class", "fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex justify-center items-center");
    			add_location(div3, file$7, 227, 8, 8060);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div2);
    			append_dev(div2, div0);
    			append_dev(div0, h2);
    			append_dev(div0, t1);
    			append_dev(div0, p0);
    			append_dev(div0, t2);
    			append_dev(div0, button0);
    			append_dev(button0, t3);
    			append_dev(button0, p1);
    			append_dev(button0, t4);
    			append_dev(button0, svg);
    			append_dev(svg, path);
    			append_dev(div2, t5);
    			append_dev(div2, p2);
    			append_dev(div2, t6);
    			mount_component(textinput, div2, null);
    			append_dev(div2, t7);
    			append_dev(div2, p3);
    			append_dev(div2, t8);
    			mount_component(passwordinput, div2, null);
    			append_dev(div2, t9);
    			append_dev(div2, p4);
    			append_dev(div2, t10);
    			mount_component(button1, div2, null);
    			append_dev(div2, t11);
    			if (if_block) if_block.m(div2, null);
    			append_dev(div2, t12);
    			append_dev(div2, p5);
    			append_dev(div2, t13);
    			append_dev(div2, div1);
    			append_dev(div1, t14);
    			append_dev(div1, t15);
    			append_dev(div1, t16);
    			append_dev(div1, p6);
    			append_dev(div1, t17);
    			append_dev(div1, button2);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler_5*/ ctx[14], false, false, false, false),
    					listen_dev(button2, "click", /*click_handler_7*/ ctx[18], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			const textinput_changes = {};

    			if (!updating_value && dirty & /*username*/ 8) {
    				updating_value = true;
    				textinput_changes.value = /*username*/ ctx[3];
    				add_flush_callback(() => updating_value = false);
    			}

    			textinput.$set(textinput_changes);
    			const passwordinput_changes = {};

    			if (!updating_value_1 && dirty & /*password*/ 16) {
    				updating_value_1 = true;
    				passwordinput_changes.value = /*password*/ ctx[4];
    				add_flush_callback(() => updating_value_1 = false);
    			}

    			passwordinput.$set(passwordinput_changes);

    			if (/*usernameTaken*/ ctx[2]) {
    				if (if_block) ; else {
    					if_block = create_if_block_3$2(ctx);
    					if_block.c();
    					if_block.m(div2, t12);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(textinput.$$.fragment, local);
    			transition_in(passwordinput.$$.fragment, local);
    			transition_in(button1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(textinput.$$.fragment, local);
    			transition_out(passwordinput.$$.fragment, local);
    			transition_out(button1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			destroy_component(textinput);
    			destroy_component(passwordinput);
    			destroy_component(button1);
    			if (if_block) if_block.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$2.name,
    		type: "if",
    		source: "(227:25) ",
    		ctx
    	});

    	return block;
    }

    // (157:4) {#if signupModal}
    function create_if_block$4(ctx) {
    	let div3;
    	let div2;
    	let div0;
    	let h2;
    	let t1;
    	let button0;
    	let t2;
    	let p0;
    	let t3;
    	let svg;
    	let path;
    	let t4;
    	let p1;
    	let t5;
    	let p2;
    	let t7;
    	let p3;
    	let t8;
    	let textinput;
    	let updating_value;
    	let t9;
    	let p4;
    	let t10;
    	let passwordinput;
    	let updating_value_1;
    	let t11;
    	let p5;
    	let t12;
    	let button1;
    	let t13;
    	let t14;
    	let p6;
    	let t15;
    	let div1;
    	let t16;
    	let t17_value = " " + "";
    	let t17;
    	let t18;
    	let p7;
    	let t19;
    	let button2;
    	let current;
    	let mounted;
    	let dispose;

    	function textinput_value_binding(value) {
    		/*textinput_value_binding*/ ctx[10](value);
    	}

    	let textinput_props = { placeholder: "Username" };

    	if (/*username*/ ctx[3] !== void 0) {
    		textinput_props.value = /*username*/ ctx[3];
    	}

    	textinput = new TextInput({ props: textinput_props, $$inline: true });
    	binding_callbacks.push(() => bind(textinput, 'value', textinput_value_binding));

    	function passwordinput_value_binding(value) {
    		/*passwordinput_value_binding*/ ctx[11](value);
    	}

    	let passwordinput_props = {};

    	if (/*password*/ ctx[4] !== void 0) {
    		passwordinput_props.value = /*password*/ ctx[4];
    	}

    	passwordinput = new PasswordInput({
    			props: passwordinput_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(passwordinput, 'value', passwordinput_value_binding));

    	button1 = new Button({
    			props: { label: "Sign Up" },
    			$$inline: true
    		});

    	button1.$on("click", /*click_handler_3*/ ctx[12]);
    	let if_block = /*usernameTaken*/ ctx[2] && create_if_block_1$3(ctx);

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			h2 = element("h2");
    			h2.textContent = "Welcome to BrainSpark";
    			t1 = space();
    			button0 = element("button");
    			t2 = text("Close\n                        \n                        ");
    			p0 = element("p");
    			t3 = space();
    			svg = svg_element("svg");
    			path = svg_element("path");
    			t4 = space();
    			p1 = element("p");
    			t5 = space();
    			p2 = element("p");
    			p2.textContent = "BrainSpark is a platform that helps students learn via\n                    games, powerups, and customized learning.";
    			t7 = space();
    			p3 = element("p");
    			t8 = space();
    			create_component(textinput.$$.fragment);
    			t9 = space();
    			p4 = element("p");
    			t10 = space();
    			create_component(passwordinput.$$.fragment);
    			t11 = space();
    			p5 = element("p");
    			t12 = space();
    			create_component(button1.$$.fragment);
    			t13 = space();
    			if (if_block) if_block.c();
    			t14 = space();
    			p6 = element("p");
    			t15 = space();
    			div1 = element("div");
    			t16 = text("Already have an account?");
    			t17 = text(t17_value);
    			t18 = space();
    			p7 = element("p");
    			t19 = space();
    			button2 = element("button");
    			button2.textContent = "Log in";
    			attr_dev(h2, "class", "text-3xl font-bold font-vag");
    			add_location(h2, file$7, 162, 20, 5540);
    			attr_dev(p0, "class", "px-1");
    			add_location(p0, file$7, 173, 24, 5959);
    			attr_dev(path, "stroke-linecap", "round");
    			attr_dev(path, "stroke-linejoin", "round");
    			attr_dev(path, "d", "M6 18 18 6M6 6l12 12");
    			add_location(path, file$7, 182, 28, 6355);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "stroke-width", "1.5");
    			attr_dev(svg, "stroke", "currentColor");
    			attr_dev(svg, "class", "w-6 h-6");
    			add_location(svg, file$7, 174, 24, 6004);
    			attr_dev(button0, "class", "ml-auto flex");
    			add_location(button0, file$7, 165, 20, 5673);
    			attr_dev(div0, "class", "flex");
    			add_location(div0, file$7, 161, 16, 5501);
    			attr_dev(p1, "class", "py-3");
    			add_location(p1, file$7, 190, 16, 6660);
    			add_location(p2, file$7, 191, 16, 6697);
    			attr_dev(p3, "class", "py-3");
    			add_location(p3, file$7, 195, 16, 6875);
    			attr_dev(p4, "class", "py-3");
    			add_location(p4, file$7, 197, 16, 6987);
    			attr_dev(p5, "class", "py-3");
    			add_location(p5, file$7, 199, 16, 7080);
    			attr_dev(p6, "class", "py-3");
    			add_location(p6, file$7, 212, 16, 7546);
    			attr_dev(p7, "class", "px-1");
    			add_location(p7, file$7, 215, 20, 7672);
    			attr_dev(button2, "class", "text-blue-500");
    			add_location(button2, file$7, 216, 20, 7713);
    			attr_dev(div1, "class", "flex");
    			add_location(div1, file$7, 213, 16, 7583);
    			attr_dev(div2, "class", "bg-white p-10 rounded-md");
    			add_location(div2, file$7, 160, 12, 5446);
    			attr_dev(div3, "class", "fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex justify-center items-center");
    			add_location(div3, file$7, 157, 8, 5310);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div2);
    			append_dev(div2, div0);
    			append_dev(div0, h2);
    			append_dev(div0, t1);
    			append_dev(div0, button0);
    			append_dev(button0, t2);
    			append_dev(button0, p0);
    			append_dev(button0, t3);
    			append_dev(button0, svg);
    			append_dev(svg, path);
    			append_dev(div2, t4);
    			append_dev(div2, p1);
    			append_dev(div2, t5);
    			append_dev(div2, p2);
    			append_dev(div2, t7);
    			append_dev(div2, p3);
    			append_dev(div2, t8);
    			mount_component(textinput, div2, null);
    			append_dev(div2, t9);
    			append_dev(div2, p4);
    			append_dev(div2, t10);
    			mount_component(passwordinput, div2, null);
    			append_dev(div2, t11);
    			append_dev(div2, p5);
    			append_dev(div2, t12);
    			mount_component(button1, div2, null);
    			append_dev(div2, t13);
    			if (if_block) if_block.m(div2, null);
    			append_dev(div2, t14);
    			append_dev(div2, p6);
    			append_dev(div2, t15);
    			append_dev(div2, div1);
    			append_dev(div1, t16);
    			append_dev(div1, t17);
    			append_dev(div1, t18);
    			append_dev(div1, p7);
    			append_dev(div1, t19);
    			append_dev(div1, button2);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler_2*/ ctx[9], false, false, false, false),
    					listen_dev(button2, "click", /*click_handler_4*/ ctx[13], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			const textinput_changes = {};

    			if (!updating_value && dirty & /*username*/ 8) {
    				updating_value = true;
    				textinput_changes.value = /*username*/ ctx[3];
    				add_flush_callback(() => updating_value = false);
    			}

    			textinput.$set(textinput_changes);
    			const passwordinput_changes = {};

    			if (!updating_value_1 && dirty & /*password*/ 16) {
    				updating_value_1 = true;
    				passwordinput_changes.value = /*password*/ ctx[4];
    				add_flush_callback(() => updating_value_1 = false);
    			}

    			passwordinput.$set(passwordinput_changes);

    			if (/*usernameTaken*/ ctx[2]) {
    				if (if_block) ; else {
    					if_block = create_if_block_1$3(ctx);
    					if_block.c();
    					if_block.m(div2, t14);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(textinput.$$.fragment, local);
    			transition_in(passwordinput.$$.fragment, local);
    			transition_in(button1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(textinput.$$.fragment, local);
    			transition_out(passwordinput.$$.fragment, local);
    			transition_out(button1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			destroy_component(textinput);
    			destroy_component(passwordinput);
    			destroy_component(button1);
    			if (if_block) if_block.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(157:4) {#if signupModal}",
    		ctx
    	});

    	return block;
    }

    // (274:16) {#if usernameTaken}
    function create_if_block_3$2(ctx) {
    	let p0;
    	let t0;
    	let p1;

    	const block = {
    		c: function create() {
    			p0 = element("p");
    			t0 = space();
    			p1 = element("p");
    			p1.textContent = "Username is taken";
    			attr_dev(p0, "class", "py-3");
    			add_location(p0, file$7, 274, 20, 9973);
    			attr_dev(p1, "class", "text-red-500");
    			add_location(p1, file$7, 275, 20, 10014);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p0, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, p1, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p0);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(p1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$2.name,
    		type: "if",
    		source: "(274:16) {#if usernameTaken}",
    		ctx
    	});

    	return block;
    }

    // (208:16) {#if usernameTaken}
    function create_if_block_1$3(ctx) {
    	let p0;
    	let t0;
    	let p1;

    	const block = {
    		c: function create() {
    			p0 = element("p");
    			t0 = space();
    			p1 = element("p");
    			p1.textContent = "Username is taken";
    			attr_dev(p0, "class", "py-3");
    			add_location(p0, file$7, 208, 20, 7374);
    			attr_dev(p1, "class", "text-red-500");
    			add_location(p1, file$7, 209, 20, 7415);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p0, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, p1, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p0);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(p1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$3.name,
    		type: "if",
    		source: "(208:16) {#if usernameTaken}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let div7;
    	let header;
    	let div0;
    	let a0;
    	let img0;
    	let img0_src_value;
    	let t0;
    	let nav;
    	let ul;
    	let li0;
    	let a1;
    	let t2;
    	let li1;
    	let t3;
    	let li2;
    	let a2;
    	let t5;
    	let li3;
    	let t6;
    	let li4;
    	let button0;
    	let t8;
    	let div4;
    	let div3;
    	let div1;
    	let h1;
    	let t10;
    	let p0;
    	let t11;
    	let p1;
    	let t13;
    	let p2;
    	let t14;
    	let button1;
    	let t16;
    	let div2;
    	let img1;
    	let img1_src_value;
    	let t17;
    	let current_block_type_index;
    	let if_block;
    	let t18;
    	let footer;
    	let div6;
    	let div5;
    	let p3;
    	let t20;
    	let p4;
    	let current;
    	let mounted;
    	let dispose;
    	const if_block_creators = [create_if_block$4, create_if_block_2$2];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*signupModal*/ ctx[0]) return 0;
    		if (/*loginModal*/ ctx[1]) return 1;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx))) {
    		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	const block = {
    		c: function create() {
    			div7 = element("div");
    			header = element("header");
    			div0 = element("div");
    			a0 = element("a");
    			img0 = element("img");
    			t0 = space();
    			nav = element("nav");
    			ul = element("ul");
    			li0 = element("li");
    			a1 = element("a");
    			a1.textContent = "Home";
    			t2 = space();
    			li1 = element("li");
    			t3 = space();
    			li2 = element("li");
    			a2 = element("a");
    			a2.textContent = "About";
    			t5 = space();
    			li3 = element("li");
    			t6 = space();
    			li4 = element("li");
    			button0 = element("button");
    			button0.textContent = "Sign Up";
    			t8 = space();
    			div4 = element("div");
    			div3 = element("div");
    			div1 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Quiz. Play. Learn.";
    			t10 = space();
    			p0 = element("p");
    			t11 = space();
    			p1 = element("p");
    			p1.textContent = "The one-stop study tool to unleash your potential,\n                    BrainSpark transforms learning into an exhilarating journey,\n                    where each quiz invites you into a world of discovery,\n                    guided by custom questions and powerups to ignite your\n                    curiosity.";
    			t13 = space();
    			p2 = element("p");
    			t14 = space();
    			button1 = element("button");
    			button1.textContent = "Get Started";
    			t16 = space();
    			div2 = element("div");
    			img1 = element("img");
    			t17 = space();
    			if (if_block) if_block.c();
    			t18 = space();
    			footer = element("footer");
    			div6 = element("div");
    			div5 = element("div");
    			p3 = element("p");
    			p3.textContent = "BrainSpark";
    			t20 = space();
    			p4 = element("p");
    			p4.textContent = "© 2024 BrainSpark";
    			if (!src_url_equal(img0.src, img0_src_value = "./assets/logo_expanded.svg")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "logo");
    			attr_dev(img0, "class", "w-60");
    			add_location(img0, file$7, 99, 16, 3020);
    			attr_dev(a0, "href", "/");
    			add_location(a0, file$7, 98, 12, 2991);
    			attr_dev(div0, "class", "flex");
    			add_location(div0, file$7, 97, 8, 2960);
    			attr_dev(a1, "href", "/");
    			add_location(a1, file$7, 104, 38, 3199);
    			attr_dev(li0, "class", "font-bold");
    			add_location(li0, file$7, 104, 16, 3177);
    			attr_dev(li1, "class", "px-2");
    			add_location(li1, file$7, 107, 16, 3349);
    			attr_dev(a2, "href", "/about");
    			add_location(a2, file$7, 108, 38, 3410);
    			attr_dev(li2, "class", "font-bold");
    			add_location(li2, file$7, 108, 16, 3388);
    			attr_dev(li3, "class", "px-2");
    			add_location(li3, file$7, 109, 16, 3458);
    			add_location(button0, file$7, 111, 20, 3540);
    			attr_dev(li4, "class", "font-bold");
    			add_location(li4, file$7, 110, 16, 3497);
    			attr_dev(ul, "class", "flex");
    			add_location(ul, file$7, 103, 12, 3143);
    			add_location(nav, file$7, 102, 8, 3125);
    			attr_dev(header, "class", "flex justify-between p-10 items-center");
    			add_location(header, file$7, 95, 4, 2876);
    			attr_dev(h1, "class", "text-7xl font-vag font-bold");
    			add_location(h1, file$7, 125, 16, 4023);
    			attr_dev(p0, "class", "py-3");
    			add_location(p0, file$7, 127, 16, 4134);
    			attr_dev(p1, "class", "text-2xl max-w-[850px]");
    			add_location(p1, file$7, 128, 16, 4171);
    			attr_dev(p2, "class", "py-3");
    			add_location(p2, file$7, 135, 16, 4576);
    			attr_dev(button1, "class", "bg-gradient-to-br from-[#5c4f9e] to-[#342d59] text-white py-4 px-9 text-xl rounded-md");
    			add_location(button1, file$7, 136, 16, 4613);
    			attr_dev(div1, "class", "w-1/2");
    			add_location(div1, file$7, 124, 12, 3987);
    			attr_dev(img1, "class", "rounded-2xl border shadow-xl hover:scale-110 transition duration-500 ease-in-out");
    			if (!src_url_equal(img1.src, img1_src_value = "./assets/game_screen.png")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "game screen");
    			add_location(img1, file$7, 146, 16, 4989);
    			attr_dev(div2, "class", "w-1/2 pr-10");
    			add_location(div2, file$7, 145, 12, 4947);
    			attr_dev(div3, "class", "flex");
    			add_location(div3, file$7, 123, 8, 3956);
    			attr_dev(div4, "class", "p-10 flex flex-col");
    			add_location(div4, file$7, 121, 4, 3777);
    			attr_dev(p3, "class", "text-2xl font-bold font-vag");
    			add_location(p3, file$7, 297, 16, 10754);
    			attr_dev(p4, "class", "text-xl");
    			add_location(p4, file$7, 298, 16, 10824);
    			add_location(div5, file$7, 296, 12, 10732);
    			attr_dev(div6, "class", "flex justify-between");
    			add_location(div6, file$7, 295, 8, 10685);
    			attr_dev(footer, "class", "w-full md:p-6 mt-auto p-10");
    			add_location(footer, file$7, 294, 4, 10633);
    			attr_dev(div7, "class", "flex flex-col min-h-screen bg-white");
    			add_location(div7, file$7, 94, 0, 2822);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div7, anchor);
    			append_dev(div7, header);
    			append_dev(header, div0);
    			append_dev(div0, a0);
    			append_dev(a0, img0);
    			append_dev(header, t0);
    			append_dev(header, nav);
    			append_dev(nav, ul);
    			append_dev(ul, li0);
    			append_dev(li0, a1);
    			append_dev(ul, t2);
    			append_dev(ul, li1);
    			append_dev(ul, t3);
    			append_dev(ul, li2);
    			append_dev(li2, a2);
    			append_dev(ul, t5);
    			append_dev(ul, li3);
    			append_dev(ul, t6);
    			append_dev(ul, li4);
    			append_dev(li4, button0);
    			append_dev(div7, t8);
    			append_dev(div7, div4);
    			append_dev(div4, div3);
    			append_dev(div3, div1);
    			append_dev(div1, h1);
    			append_dev(div1, t10);
    			append_dev(div1, p0);
    			append_dev(div1, t11);
    			append_dev(div1, p1);
    			append_dev(div1, t13);
    			append_dev(div1, p2);
    			append_dev(div1, t14);
    			append_dev(div1, button1);
    			append_dev(div3, t16);
    			append_dev(div3, div2);
    			append_dev(div2, img1);
    			append_dev(div7, t17);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(div7, null);
    			}

    			append_dev(div7, t18);
    			append_dev(div7, footer);
    			append_dev(footer, div6);
    			append_dev(div6, div5);
    			append_dev(div5, p3);
    			append_dev(div5, t20);
    			append_dev(div5, p4);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler*/ ctx[7], false, false, false, false),
    					listen_dev(button1, "click", /*click_handler_1*/ ctx[8], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if (~current_block_type_index) {
    					if_blocks[current_block_type_index].p(ctx, dirty);
    				}
    			} else {
    				if (if_block) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block = if_blocks[current_block_type_index];

    					if (!if_block) {
    						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block.c();
    					} else {
    						if_block.p(ctx, dirty);
    					}

    					transition_in(if_block, 1);
    					if_block.m(div7, t18);
    				} else {
    					if_block = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div7);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d();
    			}

    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('LandingPage', slots, []);
    	let { signupModal = false } = $$props;
    	let { loginModal = false } = $$props;
    	let { usernameTaken = false } = $$props;
    	let username = "";
    	let password = "";

    	onMount(() => {
    		const uid = getCookie$1("uid");

    		if (uid) {
    			console.log("User is logged in");

    			// redirect to dashboard
    			push("/home");
    		}
    	});

    	function signup() {
    		const endpoint = "http://localhost:3000" + "/user/signup";
    		const body = { username, password };

    		fetch(endpoint, {
    			method: "POST",
    			headers: { "Content-Type": "application/json" },
    			body: JSON.stringify(body)
    		}).then(response => response.json()).then(data => {
    			if (data.data.success) {
    				$$invalidate(0, signupModal = false);

    				setCookie("uid", data.data.uid, {
    					sameSite: "strict",
    					path: "/",
    					maxAge: 60 * 60 * 24 * 7, // 7 days
    					
    				});

    				push("/home");
    			} else {
    				console.log(data.data.message);
    				$$invalidate(2, usernameTaken = true);
    			}
    		}).catch(error => {
    			console.error("Error:", error);
    			$$invalidate(2, usernameTaken = true);
    		});
    	}

    	function login() {
    		const endpoint = "http://localhost:3000" + "/user/login";
    		const body = { username, password };

    		fetch(endpoint, {
    			method: "POST",
    			headers: { "Content-Type": "application/json" },
    			body: JSON.stringify(body)
    		}).then(response => response.json()).then(data => {
    			$$invalidate(0, signupModal = false);

    			if (data.data.success) {
    				setCookie("uid", data.data.uid, {
    					sameSite: "strict",
    					path: "/",
    					maxAge: 60 * 60 * 24 * 7, // 7 days
    					
    				});

    				push("/home");
    			} else {
    				console.log(data.data.message);
    			}
    		}).catch(error => console.error("Error:", error));
    	}

    	const writable_props = ['signupModal', 'loginModal', 'usernameTaken'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$5.warn(`<LandingPage> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => {
    		$$invalidate(0, signupModal = true);
    	};

    	const click_handler_1 = () => {
    		$$invalidate(0, signupModal = true);
    	};

    	const click_handler_2 = () => {
    		$$invalidate(0, signupModal = false);
    	};

    	function textinput_value_binding(value) {
    		username = value;
    		$$invalidate(3, username);
    	}

    	function passwordinput_value_binding(value) {
    		password = value;
    		$$invalidate(4, password);
    	}

    	const click_handler_3 = () => {
    		signup();
    	};

    	const click_handler_4 = () => {
    		$$invalidate(1, loginModal = true);
    		$$invalidate(0, signupModal = false);
    	};

    	const click_handler_5 = () => {
    		$$invalidate(1, loginModal = false);
    	};

    	function textinput_value_binding_1(value) {
    		username = value;
    		$$invalidate(3, username);
    	}

    	function passwordinput_value_binding_1(value) {
    		password = value;
    		$$invalidate(4, password);
    	}

    	const click_handler_6 = () => {
    		login();
    	};

    	const click_handler_7 = () => {
    		$$invalidate(1, loginModal = false);
    		$$invalidate(0, signupModal = true);
    	};

    	$$self.$$set = $$props => {
    		if ('signupModal' in $$props) $$invalidate(0, signupModal = $$props.signupModal);
    		if ('loginModal' in $$props) $$invalidate(1, loginModal = $$props.loginModal);
    		if ('usernameTaken' in $$props) $$invalidate(2, usernameTaken = $$props.usernameTaken);
    	};

    	$$self.$capture_state = () => ({
    		Button,
    		TextInput,
    		PasswordInput,
    		fetch,
    		setCookie,
    		getCookie: getCookie$1,
    		deleteCookie: deleteCookie$1,
    		push,
    		onMount,
    		signupModal,
    		loginModal,
    		usernameTaken,
    		username,
    		password,
    		signup,
    		login
    	});

    	$$self.$inject_state = $$props => {
    		if ('signupModal' in $$props) $$invalidate(0, signupModal = $$props.signupModal);
    		if ('loginModal' in $$props) $$invalidate(1, loginModal = $$props.loginModal);
    		if ('usernameTaken' in $$props) $$invalidate(2, usernameTaken = $$props.usernameTaken);
    		if ('username' in $$props) $$invalidate(3, username = $$props.username);
    		if ('password' in $$props) $$invalidate(4, password = $$props.password);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		signupModal,
    		loginModal,
    		usernameTaken,
    		username,
    		password,
    		signup,
    		login,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		textinput_value_binding,
    		passwordinput_value_binding,
    		click_handler_3,
    		click_handler_4,
    		click_handler_5,
    		textinput_value_binding_1,
    		passwordinput_value_binding_1,
    		click_handler_6,
    		click_handler_7
    	];
    }

    class LandingPage extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {
    			signupModal: 0,
    			loginModal: 1,
    			usernameTaken: 2
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "LandingPage",
    			options,
    			id: create_fragment$8.name
    		});
    	}

    	get signupModal() {
    		throw new Error("<LandingPage>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set signupModal(value) {
    		throw new Error("<LandingPage>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get loginModal() {
    		throw new Error("<LandingPage>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set loginModal(value) {
    		throw new Error("<LandingPage>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get usernameTaken() {
    		throw new Error("<LandingPage>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set usernameTaken(value) {
    		throw new Error("<LandingPage>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/AltButton.svelte generated by Svelte v3.59.2 */

    const file$6 = "src/components/AltButton.svelte";

    function create_fragment$7(ctx) {
    	let button;
    	let t;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			t = text(/*label*/ ctx[0]);
    			attr_dev(button, "class", "py-2 px-3 rounded-md");
    			set_style(button, "background-color", /*color*/ ctx[1]);
    			set_style(button, "color", /*textColor*/ ctx[2]);
    			add_location(button, file$6, 6, 0, 122);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[3], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*label*/ 1) set_data_dev(t, /*label*/ ctx[0]);

    			if (dirty & /*color*/ 2) {
    				set_style(button, "background-color", /*color*/ ctx[1]);
    			}

    			if (dirty & /*textColor*/ 4) {
    				set_style(button, "color", /*textColor*/ ctx[2]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('AltButton', slots, []);
    	let { label = "Button" } = $$props;
    	let { color = "purple" } = $$props;
    	let { textColor = "black" } = $$props;
    	const writable_props = ['label', 'color', 'textColor'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<AltButton> was created with unknown prop '${key}'`);
    	});

    	function click_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	$$self.$$set = $$props => {
    		if ('label' in $$props) $$invalidate(0, label = $$props.label);
    		if ('color' in $$props) $$invalidate(1, color = $$props.color);
    		if ('textColor' in $$props) $$invalidate(2, textColor = $$props.textColor);
    	};

    	$$self.$capture_state = () => ({ label, color, textColor });

    	$$self.$inject_state = $$props => {
    		if ('label' in $$props) $$invalidate(0, label = $$props.label);
    		if ('color' in $$props) $$invalidate(1, color = $$props.color);
    		if ('textColor' in $$props) $$invalidate(2, textColor = $$props.textColor);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [label, color, textColor, click_handler];
    }

    class AltButton extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, { label: 0, color: 1, textColor: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AltButton",
    			options,
    			id: create_fragment$7.name
    		});
    	}

    	get label() {
    		throw new Error("<AltButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set label(value) {
    		throw new Error("<AltButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get color() {
    		throw new Error("<AltButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<AltButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get textColor() {
    		throw new Error("<AltButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set textColor(value) {
    		throw new Error("<AltButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    let mathSubTopics = [
        "AP Precalculus",
        "AP Calculus AB",
        "AP Calculus BC",
        "AP Statistics"
    ];

    let scienceSubTopics = [
        "AP Biology",
        "AP Chemistry",
        "AP Environmental Science",
        "AP Physics 1",
        "AP Physics 2",
        "AP Physics C"
    ];

    let englishSubTopics = [
        "AP English Language",
        "AP English Literature"
    ];

    let historySubTopics = [
        "AP United States History",
        "AP World History",
        "AP European History",
        "AP Human Geography",
        "AP United States Government",
        "AP Comparative Government"
    ];

    let miscSubTopics = [
        "AP Macroeconomics",
        "AP Microeconomics",
        "AP Psychology"
    ];

    Promise.resolve();

    /* src\SvelteCookie.svelte generated by Svelte v3.44.2 */

    function getCookie(name) {
    	let cookieName = name + "=";
    	let decodedCookie = decodeURIComponent(document.cookie);
    	let ca = decodedCookie.split(';');

    	for (let i = 0; i < ca.length; i++) {
    		let c = ca[i];

    		while (c.charAt(0) == ' ') {
    			c = c.substring(1);
    		}

    		if (c.indexOf(cookieName) == 0) {
    			return c.substring(cookieName.length, c.length);
    		}
    	}

    	return "";
    }

    function deleteCookie(name) {
    	document.cookie = name + '=; Max-Age=-99999999;';
    }

    /* node_modules/svelte-loading-spinners/Circle2.svelte generated by Svelte v3.59.2 */

    const file$5 = "node_modules/svelte-loading-spinners/Circle2.svelte";

    function create_fragment$6(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "circle svelte-1w4sjib");
    			set_style(div, "--size", /*size*/ ctx[0] + /*unit*/ ctx[1]);
    			set_style(div, "--colorInner", /*colorInner*/ ctx[5]);
    			set_style(div, "--colorCenter", /*colorCenter*/ ctx[4]);
    			set_style(div, "--colorOuter", /*colorOuter*/ ctx[3]);
    			set_style(div, "--durationInner", /*durationInner*/ ctx[7]);
    			set_style(div, "--durationCenter", /*durationCenter*/ ctx[8]);
    			set_style(div, "--durationOuter", /*durationOuter*/ ctx[6]);
    			toggle_class(div, "pause-animation", /*pause*/ ctx[2]);
    			add_location(div, file$5, 12, 0, 418);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*size, unit*/ 3) {
    				set_style(div, "--size", /*size*/ ctx[0] + /*unit*/ ctx[1]);
    			}

    			if (dirty & /*colorInner*/ 32) {
    				set_style(div, "--colorInner", /*colorInner*/ ctx[5]);
    			}

    			if (dirty & /*colorCenter*/ 16) {
    				set_style(div, "--colorCenter", /*colorCenter*/ ctx[4]);
    			}

    			if (dirty & /*colorOuter*/ 8) {
    				set_style(div, "--colorOuter", /*colorOuter*/ ctx[3]);
    			}

    			if (dirty & /*durationInner*/ 128) {
    				set_style(div, "--durationInner", /*durationInner*/ ctx[7]);
    			}

    			if (dirty & /*durationCenter*/ 256) {
    				set_style(div, "--durationCenter", /*durationCenter*/ ctx[8]);
    			}

    			if (dirty & /*durationOuter*/ 64) {
    				set_style(div, "--durationOuter", /*durationOuter*/ ctx[6]);
    			}

    			if (dirty & /*pause*/ 4) {
    				toggle_class(div, "pause-animation", /*pause*/ ctx[2]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Circle2', slots, []);
    	let { size = '60' } = $$props;
    	let { unit = 'px' } = $$props;
    	let { pause = false } = $$props;
    	let { colorOuter = '#FF3E00' } = $$props;
    	let { colorCenter = '#40B3FF' } = $$props;
    	let { colorInner = '#676778' } = $$props;
    	let { durationMultiplier = 1 } = $$props;
    	let { durationOuter = `${durationMultiplier * 2}s` } = $$props;
    	let { durationInner = `${durationMultiplier * 1.5}s` } = $$props;
    	let { durationCenter = `${durationMultiplier * 3}s` } = $$props;

    	const writable_props = [
    		'size',
    		'unit',
    		'pause',
    		'colorOuter',
    		'colorCenter',
    		'colorInner',
    		'durationMultiplier',
    		'durationOuter',
    		'durationInner',
    		'durationCenter'
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Circle2> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('size' in $$props) $$invalidate(0, size = $$props.size);
    		if ('unit' in $$props) $$invalidate(1, unit = $$props.unit);
    		if ('pause' in $$props) $$invalidate(2, pause = $$props.pause);
    		if ('colorOuter' in $$props) $$invalidate(3, colorOuter = $$props.colorOuter);
    		if ('colorCenter' in $$props) $$invalidate(4, colorCenter = $$props.colorCenter);
    		if ('colorInner' in $$props) $$invalidate(5, colorInner = $$props.colorInner);
    		if ('durationMultiplier' in $$props) $$invalidate(9, durationMultiplier = $$props.durationMultiplier);
    		if ('durationOuter' in $$props) $$invalidate(6, durationOuter = $$props.durationOuter);
    		if ('durationInner' in $$props) $$invalidate(7, durationInner = $$props.durationInner);
    		if ('durationCenter' in $$props) $$invalidate(8, durationCenter = $$props.durationCenter);
    	};

    	$$self.$capture_state = () => ({
    		size,
    		unit,
    		pause,
    		colorOuter,
    		colorCenter,
    		colorInner,
    		durationMultiplier,
    		durationOuter,
    		durationInner,
    		durationCenter
    	});

    	$$self.$inject_state = $$props => {
    		if ('size' in $$props) $$invalidate(0, size = $$props.size);
    		if ('unit' in $$props) $$invalidate(1, unit = $$props.unit);
    		if ('pause' in $$props) $$invalidate(2, pause = $$props.pause);
    		if ('colorOuter' in $$props) $$invalidate(3, colorOuter = $$props.colorOuter);
    		if ('colorCenter' in $$props) $$invalidate(4, colorCenter = $$props.colorCenter);
    		if ('colorInner' in $$props) $$invalidate(5, colorInner = $$props.colorInner);
    		if ('durationMultiplier' in $$props) $$invalidate(9, durationMultiplier = $$props.durationMultiplier);
    		if ('durationOuter' in $$props) $$invalidate(6, durationOuter = $$props.durationOuter);
    		if ('durationInner' in $$props) $$invalidate(7, durationInner = $$props.durationInner);
    		if ('durationCenter' in $$props) $$invalidate(8, durationCenter = $$props.durationCenter);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		size,
    		unit,
    		pause,
    		colorOuter,
    		colorCenter,
    		colorInner,
    		durationOuter,
    		durationInner,
    		durationCenter,
    		durationMultiplier
    	];
    }

    class Circle2 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {
    			size: 0,
    			unit: 1,
    			pause: 2,
    			colorOuter: 3,
    			colorCenter: 4,
    			colorInner: 5,
    			durationMultiplier: 9,
    			durationOuter: 6,
    			durationInner: 7,
    			durationCenter: 8
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Circle2",
    			options,
    			id: create_fragment$6.name
    		});
    	}

    	get size() {
    		throw new Error("<Circle2>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<Circle2>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get unit() {
    		throw new Error("<Circle2>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set unit(value) {
    		throw new Error("<Circle2>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get pause() {
    		throw new Error("<Circle2>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set pause(value) {
    		throw new Error("<Circle2>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get colorOuter() {
    		throw new Error("<Circle2>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set colorOuter(value) {
    		throw new Error("<Circle2>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get colorCenter() {
    		throw new Error("<Circle2>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set colorCenter(value) {
    		throw new Error("<Circle2>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get colorInner() {
    		throw new Error("<Circle2>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set colorInner(value) {
    		throw new Error("<Circle2>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get durationMultiplier() {
    		throw new Error("<Circle2>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set durationMultiplier(value) {
    		throw new Error("<Circle2>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get durationOuter() {
    		throw new Error("<Circle2>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set durationOuter(value) {
    		throw new Error("<Circle2>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get durationInner() {
    		throw new Error("<Circle2>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set durationInner(value) {
    		throw new Error("<Circle2>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get durationCenter() {
    		throw new Error("<Circle2>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set durationCenter(value) {
    		throw new Error("<Circle2>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/pages/HomePage.svelte generated by Svelte v3.59.2 */

    const { console: console_1$4 } = globals;
    const file$4 = "src/pages/HomePage.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[21] = list[i];
    	child_ctx[23] = i;
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[24] = list[i];
    	child_ctx[23] = i;
    	return child_ctx;
    }

    // (98:0) {:else}
    function create_else_block$2(ctx) {
    	let header;
    	let div0;
    	let a0;
    	let img0;
    	let img0_src_value;
    	let t0;
    	let nav;
    	let ul;
    	let li0;
    	let a1;
    	let t2;
    	let li1;
    	let t3;
    	let li2;
    	let a2;
    	let t5;
    	let li3;
    	let t6;
    	let li4;
    	let a3;
    	let t8;
    	let li5;
    	let t9;
    	let li6;
    	let button0;
    	let img1;
    	let img1_src_value;
    	let t10;
    	let p0;
    	let t11;
    	let svg;
    	let path;
    	let t12;
    	let div3;
    	let div1;
    	let h1;
    	let t14;
    	let button1;
    	let t15;
    	let p1;
    	let t16;
    	let div2;
    	let t17;
    	let t18;
    	let if_block1_anchor;
    	let current;
    	let mounted;
    	let dispose;

    	button1 = new Button({
    			props: { label: "Create a Game" },
    			$$inline: true
    		});

    	button1.$on("click", /*click_handler_1*/ ctx[10]);
    	let each_value_1 = /*gameHistory*/ ctx[6];
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	let if_block0 = /*showAccountDropdown*/ ctx[1] && create_if_block_4$1(ctx);
    	let if_block1 = /*createGameModal*/ ctx[0] && create_if_block_1$2(ctx);

    	const block = {
    		c: function create() {
    			header = element("header");
    			div0 = element("div");
    			a0 = element("a");
    			img0 = element("img");
    			t0 = space();
    			nav = element("nav");
    			ul = element("ul");
    			li0 = element("li");
    			a1 = element("a");
    			a1.textContent = "Home";
    			t2 = space();
    			li1 = element("li");
    			t3 = space();
    			li2 = element("li");
    			a2 = element("a");
    			a2.textContent = "Leaderboard";
    			t5 = space();
    			li3 = element("li");
    			t6 = space();
    			li4 = element("li");
    			a3 = element("a");
    			a3.textContent = "About";
    			t8 = space();
    			li5 = element("li");
    			t9 = space();
    			li6 = element("li");
    			button0 = element("button");
    			img1 = element("img");
    			t10 = space();
    			p0 = element("p");
    			t11 = space();
    			svg = svg_element("svg");
    			path = svg_element("path");
    			t12 = space();
    			div3 = element("div");
    			div1 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Game History";
    			t14 = space();
    			create_component(button1.$$.fragment);
    			t15 = space();
    			p1 = element("p");
    			t16 = space();
    			div2 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t17 = space();
    			if (if_block0) if_block0.c();
    			t18 = space();
    			if (if_block1) if_block1.c();
    			if_block1_anchor = empty();
    			if (!src_url_equal(img0.src, img0_src_value = "./assets/logo_expanded.svg")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "logo");
    			attr_dev(img0, "class", "w-60");
    			add_location(img0, file$4, 102, 16, 3114);
    			attr_dev(a0, "href", "/");
    			add_location(a0, file$4, 101, 12, 3085);
    			attr_dev(div0, "class", "flex");
    			add_location(div0, file$4, 100, 8, 3054);
    			attr_dev(a1, "href", "/");
    			add_location(a1, file$4, 107, 38, 3306);
    			attr_dev(li0, "class", "font-bold");
    			add_location(li0, file$4, 107, 16, 3284);
    			attr_dev(li1, "class", "px-2");
    			add_location(li1, file$4, 108, 16, 3348);
    			attr_dev(a2, "href", "/#/leaderboard");
    			add_location(a2, file$4, 110, 20, 3430);
    			attr_dev(li2, "class", "font-bold");
    			add_location(li2, file$4, 109, 16, 3387);
    			attr_dev(li3, "class", "px-2");
    			add_location(li3, file$4, 112, 16, 3509);
    			attr_dev(a3, "href", "/about");
    			add_location(a3, file$4, 113, 38, 3570);
    			attr_dev(li4, "class", "font-bold");
    			add_location(li4, file$4, 113, 16, 3548);
    			attr_dev(li5, "class", "px-2");
    			add_location(li5, file$4, 114, 16, 3618);
    			if (!src_url_equal(img1.src, img1_src_value = "../../assets/account.png")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "user");
    			attr_dev(img1, "class", "w-10");
    			add_location(img1, file$4, 121, 24, 3918);
    			attr_dev(p0, "class", "px-1");
    			add_location(p0, file$4, 126, 24, 4113);
    			attr_dev(path, "stroke-linecap", "round");
    			attr_dev(path, "stroke-linejoin", "round");
    			attr_dev(path, "d", "m19.5 8.25-7.5 7.5-7.5-7.5");
    			add_location(path, file$4, 135, 28, 4509);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "stroke-width", "1.5");
    			attr_dev(svg, "stroke", "currentColor");
    			attr_dev(svg, "class", "w-6 h-6");
    			add_location(svg, file$4, 127, 24, 4158);
    			attr_dev(button0, "class", "flex items-center");
    			add_location(button0, file$4, 116, 20, 3700);
    			attr_dev(li6, "class", "font-bold");
    			add_location(li6, file$4, 115, 16, 3657);
    			attr_dev(ul, "class", "flex items-center");
    			add_location(ul, file$4, 106, 12, 3237);
    			add_location(nav, file$4, 105, 8, 3219);
    			attr_dev(header, "class", "flex justify-between p-10 items-center");
    			add_location(header, file$4, 98, 4, 2970);
    			attr_dev(h1, "class", "text-4xl font-bold font-vag");
    			add_location(h1, file$4, 149, 12, 5007);
    			attr_dev(div1, "class", "flex justify-between");
    			add_location(div1, file$4, 148, 8, 4960);
    			attr_dev(p1, "class", "py-3");
    			add_location(p1, file$4, 157, 8, 5258);
    			attr_dev(div2, "class", "grid grid-cols-3 gap-5");
    			add_location(div2, file$4, 158, 8, 5287);
    			attr_dev(div3, "class", "py-3 px-10");
    			add_location(div3, file$4, 147, 4, 4927);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, header, anchor);
    			append_dev(header, div0);
    			append_dev(div0, a0);
    			append_dev(a0, img0);
    			append_dev(header, t0);
    			append_dev(header, nav);
    			append_dev(nav, ul);
    			append_dev(ul, li0);
    			append_dev(li0, a1);
    			append_dev(ul, t2);
    			append_dev(ul, li1);
    			append_dev(ul, t3);
    			append_dev(ul, li2);
    			append_dev(li2, a2);
    			append_dev(ul, t5);
    			append_dev(ul, li3);
    			append_dev(ul, t6);
    			append_dev(ul, li4);
    			append_dev(li4, a3);
    			append_dev(ul, t8);
    			append_dev(ul, li5);
    			append_dev(ul, t9);
    			append_dev(ul, li6);
    			append_dev(li6, button0);
    			append_dev(button0, img1);
    			append_dev(button0, t10);
    			append_dev(button0, p0);
    			append_dev(button0, t11);
    			append_dev(button0, svg);
    			append_dev(svg, path);
    			insert_dev(target, t12, anchor);
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div1);
    			append_dev(div1, h1);
    			append_dev(div1, t14);
    			mount_component(button1, div1, null);
    			append_dev(div3, t15);
    			append_dev(div3, p1);
    			append_dev(div3, t16);
    			append_dev(div3, div2);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div2, null);
    				}
    			}

    			insert_dev(target, t17, anchor);
    			if (if_block0) if_block0.m(target, anchor);
    			insert_dev(target, t18, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert_dev(target, if_block1_anchor, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button0, "click", /*click_handler*/ ctx[9], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*gameHistory, Math*/ 64) {
    				each_value_1 = /*gameHistory*/ ctx[6];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div2, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}

    			if (/*showAccountDropdown*/ ctx[1]) {
    				if (if_block0) ; else {
    					if_block0 = create_if_block_4$1(ctx);
    					if_block0.c();
    					if_block0.m(t18.parentNode, t18);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*createGameModal*/ ctx[0]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty & /*createGameModal*/ 1) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_1$2(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button1.$$.fragment, local);
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button1.$$.fragment, local);
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(header);
    			if (detaching) detach_dev(t12);
    			if (detaching) detach_dev(div3);
    			destroy_component(button1);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t17);
    			if (if_block0) if_block0.d(detaching);
    			if (detaching) detach_dev(t18);
    			if (if_block1) if_block1.d(detaching);
    			if (detaching) detach_dev(if_block1_anchor);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$2.name,
    		type: "else",
    		source: "(98:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (94:0) {#if isLoading}
    function create_if_block$3(ctx) {
    	let div;
    	let circle2;
    	let current;
    	circle2 = new Circle2({ $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(circle2.$$.fragment);
    			attr_dev(div, "class", "flex justify-center min-h-screen items-center bg-gray-200");
    			add_location(div, file$4, 94, 4, 2855);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(circle2, div, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(circle2.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(circle2.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(circle2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(94:0) {#if isLoading}",
    		ctx
    	});

    	return block;
    }

    // (160:12) {#each gameHistory as game, i}
    function create_each_block_1(ctx) {
    	let div2;
    	let h2;
    	let t0;
    	let t1_value = /*i*/ ctx[23] + 1 + "";
    	let t1;
    	let t2;
    	let p0;
    	let t3_value = Math.round(/*game*/ ctx[24].numRight / /*game*/ ctx[24].numQuestions * 100) + "";
    	let t3;
    	let t4;
    	let t5;
    	let p1;
    	let t6;
    	let t7_value = /*game*/ ctx[24].category + "";
    	let t7;
    	let t8;
    	let div0;
    	let t9;
    	let p2;
    	let t10;
    	let t11_value = /*game*/ ctx[24].score + "";
    	let t11;
    	let t12;
    	let div1;
    	let p3;
    	let t13;
    	let t14_value = /*game*/ ctx[24].difficulty.charAt(0).toUpperCase() + /*game*/ ctx[24].difficulty.slice(1) + "";
    	let t14;
    	let t15;
    	let p4;
    	let t16;
    	let t17_value = /*game*/ ctx[24].numRight + "";
    	let t17;
    	let t18;
    	let t19_value = /*game*/ ctx[24].numQuestions + "";
    	let t19;
    	let t20;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			h2 = element("h2");
    			t0 = text("Game ");
    			t1 = text(t1_value);
    			t2 = space();
    			p0 = element("p");
    			t3 = text(t3_value);
    			t4 = text("%");
    			t5 = space();
    			p1 = element("p");
    			t6 = text("Category: ");
    			t7 = text(t7_value);
    			t8 = space();
    			div0 = element("div");
    			t9 = space();
    			p2 = element("p");
    			t10 = text("Score: ");
    			t11 = text(t11_value);
    			t12 = space();
    			div1 = element("div");
    			p3 = element("p");
    			t13 = text("Difficulty: ");
    			t14 = text(t14_value);
    			t15 = space();
    			p4 = element("p");
    			t16 = text("Questions: ");
    			t17 = text(t17_value);
    			t18 = text("/");
    			t19 = text(t19_value);
    			t20 = space();
    			add_location(p0, file$4, 165, 24, 5629);
    			attr_dev(h2, "class", "text-2xl font-bold font-vag flex justify-between");
    			add_location(h2, file$4, 161, 20, 5461);
    			attr_dev(p1, "class", "-mt-1");
    			add_location(p1, file$4, 171, 20, 5855);
    			attr_dev(div0, "class", "border");
    			add_location(div0, file$4, 172, 20, 5922);
    			attr_dev(p2, "class", "text-xl font-bold");
    			add_location(p2, file$4, 173, 20, 5965);
    			add_location(p3, file$4, 175, 24, 6068);
    			add_location(p4, file$4, 180, 24, 6300);
    			add_location(div1, file$4, 174, 20, 6038);
    			attr_dev(div2, "class", "bg-white rounded-md p-5 flex flex-col gap-2");
    			add_location(div2, file$4, 160, 16, 5383);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, h2);
    			append_dev(h2, t0);
    			append_dev(h2, t1);
    			append_dev(h2, t2);
    			append_dev(h2, p0);
    			append_dev(p0, t3);
    			append_dev(p0, t4);
    			append_dev(div2, t5);
    			append_dev(div2, p1);
    			append_dev(p1, t6);
    			append_dev(p1, t7);
    			append_dev(div2, t8);
    			append_dev(div2, div0);
    			append_dev(div2, t9);
    			append_dev(div2, p2);
    			append_dev(p2, t10);
    			append_dev(p2, t11);
    			append_dev(div2, t12);
    			append_dev(div2, div1);
    			append_dev(div1, p3);
    			append_dev(p3, t13);
    			append_dev(p3, t14);
    			append_dev(div1, t15);
    			append_dev(div1, p4);
    			append_dev(p4, t16);
    			append_dev(p4, t17);
    			append_dev(p4, t18);
    			append_dev(p4, t19);
    			append_dev(div2, t20);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*gameHistory*/ 64 && t3_value !== (t3_value = Math.round(/*game*/ ctx[24].numRight / /*game*/ ctx[24].numQuestions * 100) + "")) set_data_dev(t3, t3_value);
    			if (dirty & /*gameHistory*/ 64 && t7_value !== (t7_value = /*game*/ ctx[24].category + "")) set_data_dev(t7, t7_value);
    			if (dirty & /*gameHistory*/ 64 && t11_value !== (t11_value = /*game*/ ctx[24].score + "")) set_data_dev(t11, t11_value);
    			if (dirty & /*gameHistory*/ 64 && t14_value !== (t14_value = /*game*/ ctx[24].difficulty.charAt(0).toUpperCase() + /*game*/ ctx[24].difficulty.slice(1) + "")) set_data_dev(t14, t14_value);
    			if (dirty & /*gameHistory*/ 64 && t17_value !== (t17_value = /*game*/ ctx[24].numRight + "")) set_data_dev(t17, t17_value);
    			if (dirty & /*gameHistory*/ 64 && t19_value !== (t19_value = /*game*/ ctx[24].numQuestions + "")) set_data_dev(t19, t19_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(160:12) {#each gameHistory as game, i}",
    		ctx
    	});

    	return block;
    }

    // (188:4) {#if showAccountDropdown}
    function create_if_block_4$1(ctx) {
    	let div;
    	let ul;
    	let li0;
    	let a0;
    	let t1;
    	let li1;
    	let a1;

    	const block = {
    		c: function create() {
    			div = element("div");
    			ul = element("ul");
    			li0 = element("li");
    			a0 = element("a");
    			a0.textContent = "Account";
    			t1 = space();
    			li1 = element("li");
    			a1 = element("a");
    			a1.textContent = "Logout";
    			attr_dev(a0, "href", "/#/account");
    			add_location(a0, file$4, 193, 20, 6665);
    			attr_dev(li0, "class", "py-2");
    			add_location(li0, file$4, 192, 16, 6627);
    			attr_dev(a1, "href", "/#/logout");
    			add_location(a1, file$4, 196, 20, 6774);
    			attr_dev(li1, "class", "py-2");
    			add_location(li1, file$4, 195, 16, 6736);
    			add_location(ul, file$4, 191, 12, 6606);
    			attr_dev(div, "class", "fixed top-0 right-0 mt-[7rem] mr-10 bg-white p-5 rounded-md shadow-lg");
    			add_location(div, file$4, 188, 8, 6489);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, ul);
    			append_dev(ul, li0);
    			append_dev(li0, a0);
    			append_dev(ul, t1);
    			append_dev(ul, li1);
    			append_dev(li1, a1);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4$1.name,
    		type: "if",
    		source: "(188:4) {#if showAccountDropdown}",
    		ctx
    	});

    	return block;
    }

    // (204:4) {#if createGameModal}
    function create_if_block_1$2(ctx) {
    	let div4;
    	let div3;
    	let div0;
    	let h2;
    	let t1;
    	let p0;
    	let t2;
    	let button0;
    	let t3;
    	let p1;
    	let t4;
    	let svg;
    	let path;
    	let t5;
    	let p2;
    	let t6;
    	let p3;
    	let t7;
    	let t8;
    	let t9;
    	let input;
    	let t10;
    	let p4;
    	let t11;
    	let p5;
    	let t13;
    	let div2;
    	let div1;
    	let button1;
    	let t14;
    	let button1_class_value;
    	let t15;
    	let button2;
    	let t16;
    	let button2_class_value;
    	let t17;
    	let button3;
    	let t18;
    	let button3_class_value;
    	let t19;
    	let button4;
    	let t20;
    	let button4_class_value;
    	let t21;
    	let button5;
    	let t22;
    	let button5_class_value;
    	let t23;
    	let p6;
    	let t24;
    	let t25;
    	let p7;
    	let t26;
    	let button6;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block = /*availableSubTopics*/ ctx[5].length != 0 && create_if_block_2$1(ctx);

    	button6 = new Button({
    			props: { label: "Create" },
    			$$inline: true
    		});

    	button6.$on("click", /*click_handler_9*/ ctx[19]);

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			div3 = element("div");
    			div0 = element("div");
    			h2 = element("h2");
    			h2.textContent = "Create a Game";
    			t1 = space();
    			p0 = element("p");
    			t2 = space();
    			button0 = element("button");
    			t3 = text("Close\n                        \n                        ");
    			p1 = element("p");
    			t4 = space();
    			svg = svg_element("svg");
    			path = svg_element("path");
    			t5 = space();
    			p2 = element("p");
    			t6 = space();
    			p3 = element("p");
    			t7 = text("Number of questions: ");
    			t8 = text(/*numQuestions*/ ctx[3]);
    			t9 = space();
    			input = element("input");
    			t10 = space();
    			p4 = element("p");
    			t11 = space();
    			p5 = element("p");
    			p5.textContent = "Select your subject:";
    			t13 = space();
    			div2 = element("div");
    			div1 = element("div");
    			button1 = element("button");
    			t14 = text("Math");
    			t15 = space();
    			button2 = element("button");
    			t16 = text("Science");
    			t17 = space();
    			button3 = element("button");
    			t18 = text("English");
    			t19 = space();
    			button4 = element("button");
    			t20 = text("History");
    			t21 = space();
    			button5 = element("button");
    			t22 = text("Miscellaneous");
    			t23 = space();
    			p6 = element("p");
    			t24 = space();
    			if (if_block) if_block.c();
    			t25 = space();
    			p7 = element("p");
    			t26 = space();
    			create_component(button6.$$.fragment);
    			attr_dev(h2, "class", "text-3xl font-bold font-vag");
    			add_location(h2, file$4, 209, 20, 7193);
    			attr_dev(p0, "class", "px-10");
    			add_location(p0, file$4, 210, 20, 7272);
    			attr_dev(p1, "class", "px-1");
    			add_location(p1, file$4, 219, 24, 7604);
    			attr_dev(path, "stroke-linecap", "round");
    			attr_dev(path, "stroke-linejoin", "round");
    			attr_dev(path, "d", "M6 18 18 6M6 6l12 12");
    			add_location(path, file$4, 228, 28, 8000);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "stroke-width", "1.5");
    			attr_dev(svg, "stroke", "currentColor");
    			attr_dev(svg, "class", "w-6 h-6");
    			add_location(svg, file$4, 220, 24, 7649);
    			attr_dev(button0, "class", "ml-auto flex");
    			add_location(button0, file$4, 211, 20, 7314);
    			attr_dev(div0, "class", "flex items-center");
    			add_location(div0, file$4, 208, 16, 7141);
    			attr_dev(p2, "class", "py-3");
    			add_location(p2, file$4, 236, 16, 8305);
    			add_location(p3, file$4, 239, 16, 8422);
    			attr_dev(input, "type", "range");
    			attr_dev(input, "class", "appearance-none w-full h-1 bg-gray-300 rounded-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-[20px] [&::-webkit-slider-thumb]:h-[20px] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#5c4f9e] ");
    			attr_dev(input, "min", "1");
    			attr_dev(input, "max", "20");
    			add_location(input, file$4, 241, 16, 8482);
    			attr_dev(p4, "class", "py-3");
    			add_location(p4, file$4, 260, 16, 9193);
    			add_location(p5, file$4, 262, 16, 9349);

    			attr_dev(button1, "class", button1_class_value = "px-4 py-2 my-2 rounded-full " + (/*selectedButton*/ ctx[2] === 'Math'
    			? 'bg-violet-200'
    			: 'bg-gray-200'));

    			add_location(button1, file$4, 267, 24, 9561);

    			attr_dev(button2, "class", button2_class_value = "px-4 py-2 my-2 ml-2 rounded-full " + (/*selectedButton*/ ctx[2] === 'Science'
    			? 'bg-violet-200'
    			: 'bg-gray-200'));

    			add_location(button2, file$4, 279, 24, 10106);

    			attr_dev(button3, "class", button3_class_value = "px-4 py-2 my-2 mx-2 rounded-full " + (/*selectedButton*/ ctx[2] === 'English'
    			? 'bg-violet-200'
    			: 'bg-gray-200'));

    			add_location(button3, file$4, 291, 24, 10668);

    			attr_dev(button4, "class", button4_class_value = "px-4 py-2 my-2 rounded-full " + (/*selectedButton*/ ctx[2] === 'History'
    			? 'bg-violet-200'
    			: 'bg-gray-200'));

    			add_location(button4, file$4, 303, 24, 11230);

    			attr_dev(button5, "class", button5_class_value = "px-4 py-2 my-2 ml-2 rounded-full " + (/*selectedButton*/ ctx[2] === 'Miscellaneous'
    			? 'bg-violet-200'
    			: 'bg-gray-200'));

    			add_location(button5, file$4, 315, 24, 11787);
    			attr_dev(div1, "class", "flex");
    			add_location(div1, file$4, 266, 20, 9518);
    			attr_dev(div2, "class", "flex");
    			add_location(div2, file$4, 263, 16, 9393);
    			attr_dev(p6, "class", "py-1");
    			add_location(p6, file$4, 329, 16, 12406);
    			attr_dev(p7, "class", "py-3");
    			add_location(p7, file$4, 381, 16, 15016);
    			attr_dev(div3, "class", "bg-white p-10 rounded-md");
    			add_location(div3, file$4, 207, 12, 7086);
    			attr_dev(div4, "class", "fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex justify-center items-center");
    			add_location(div4, file$4, 204, 8, 6950);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div3);
    			append_dev(div3, div0);
    			append_dev(div0, h2);
    			append_dev(div0, t1);
    			append_dev(div0, p0);
    			append_dev(div0, t2);
    			append_dev(div0, button0);
    			append_dev(button0, t3);
    			append_dev(button0, p1);
    			append_dev(button0, t4);
    			append_dev(button0, svg);
    			append_dev(svg, path);
    			append_dev(div3, t5);
    			append_dev(div3, p2);
    			append_dev(div3, t6);
    			append_dev(div3, p3);
    			append_dev(p3, t7);
    			append_dev(p3, t8);
    			append_dev(div3, t9);
    			append_dev(div3, input);
    			set_input_value(input, /*numQuestions*/ ctx[3]);
    			append_dev(div3, t10);
    			append_dev(div3, p4);
    			append_dev(div3, t11);
    			append_dev(div3, p5);
    			append_dev(div3, t13);
    			append_dev(div3, div2);
    			append_dev(div2, div1);
    			append_dev(div1, button1);
    			append_dev(button1, t14);
    			append_dev(div1, t15);
    			append_dev(div1, button2);
    			append_dev(button2, t16);
    			append_dev(div1, t17);
    			append_dev(div1, button3);
    			append_dev(button3, t18);
    			append_dev(div1, t19);
    			append_dev(div1, button4);
    			append_dev(button4, t20);
    			append_dev(div1, t21);
    			append_dev(div1, button5);
    			append_dev(button5, t22);
    			append_dev(div3, t23);
    			append_dev(div3, p6);
    			append_dev(div3, t24);
    			if (if_block) if_block.m(div3, null);
    			append_dev(div3, t25);
    			append_dev(div3, p7);
    			append_dev(div3, t26);
    			mount_component(button6, div3, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler_2*/ ctx[11], false, false, false, false),
    					listen_dev(input, "change", /*input_change_input_handler*/ ctx[12]),
    					listen_dev(input, "input", /*input_change_input_handler*/ ctx[12]),
    					listen_dev(button1, "click", /*click_handler_3*/ ctx[13], false, false, false, false),
    					listen_dev(button2, "click", /*click_handler_4*/ ctx[14], false, false, false, false),
    					listen_dev(button3, "click", /*click_handler_5*/ ctx[15], false, false, false, false),
    					listen_dev(button4, "click", /*click_handler_6*/ ctx[16], false, false, false, false),
    					listen_dev(button5, "click", /*click_handler_7*/ ctx[17], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty & /*numQuestions*/ 8) set_data_dev(t8, /*numQuestions*/ ctx[3]);

    			if (dirty & /*numQuestions*/ 8) {
    				set_input_value(input, /*numQuestions*/ ctx[3]);
    			}

    			if (!current || dirty & /*selectedButton*/ 4 && button1_class_value !== (button1_class_value = "px-4 py-2 my-2 rounded-full " + (/*selectedButton*/ ctx[2] === 'Math'
    			? 'bg-violet-200'
    			: 'bg-gray-200'))) {
    				attr_dev(button1, "class", button1_class_value);
    			}

    			if (!current || dirty & /*selectedButton*/ 4 && button2_class_value !== (button2_class_value = "px-4 py-2 my-2 ml-2 rounded-full " + (/*selectedButton*/ ctx[2] === 'Science'
    			? 'bg-violet-200'
    			: 'bg-gray-200'))) {
    				attr_dev(button2, "class", button2_class_value);
    			}

    			if (!current || dirty & /*selectedButton*/ 4 && button3_class_value !== (button3_class_value = "px-4 py-2 my-2 mx-2 rounded-full " + (/*selectedButton*/ ctx[2] === 'English'
    			? 'bg-violet-200'
    			: 'bg-gray-200'))) {
    				attr_dev(button3, "class", button3_class_value);
    			}

    			if (!current || dirty & /*selectedButton*/ 4 && button4_class_value !== (button4_class_value = "px-4 py-2 my-2 rounded-full " + (/*selectedButton*/ ctx[2] === 'History'
    			? 'bg-violet-200'
    			: 'bg-gray-200'))) {
    				attr_dev(button4, "class", button4_class_value);
    			}

    			if (!current || dirty & /*selectedButton*/ 4 && button5_class_value !== (button5_class_value = "px-4 py-2 my-2 ml-2 rounded-full " + (/*selectedButton*/ ctx[2] === 'Miscellaneous'
    			? 'bg-violet-200'
    			: 'bg-gray-200'))) {
    				attr_dev(button5, "class", button5_class_value);
    			}

    			if (/*availableSubTopics*/ ctx[5].length != 0) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_2$1(ctx);
    					if_block.c();
    					if_block.m(div3, t25);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button6.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button6.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    			if (if_block) if_block.d();
    			destroy_component(button6);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(204:4) {#if createGameModal}",
    		ctx
    	});

    	return block;
    }

    // (331:16) {#if availableSubTopics.length != 0}
    function create_if_block_2$1(ctx) {
    	let p0;
    	let t1;
    	let p1;
    	let t2;
    	let each_1_anchor;
    	let each_value = /*availableSubTopics*/ ctx[5];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			p0 = element("p");
    			p0.textContent = "Select your subtopic:";
    			t1 = space();
    			p1 = element("p");
    			t2 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    			add_location(p0, file$4, 331, 20, 12500);
    			attr_dev(p1, "class", "py-1");
    			add_location(p1, file$4, 332, 20, 12549);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, p1, anchor);
    			insert_dev(target, t2, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(target, anchor);
    				}
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*availableSubTopics, selectedSubTopics*/ 48) {
    				each_value = /*availableSubTopics*/ ctx[5];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(p1);
    			if (detaching) detach_dev(t2);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(331:16) {#if availableSubTopics.length != 0}",
    		ctx
    	});

    	return block;
    }

    // (361:28) {#if selectedSubTopics.includes(subTopic)}
    function create_if_block_3$1(ctx) {
    	let svg;
    	let path;
    	let t;
    	let p;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			t = space();
    			p = element("p");
    			attr_dev(path, "stroke-linecap", "round");
    			attr_dev(path, "stroke-linejoin", "round");
    			attr_dev(path, "d", "m4.5 12.75 6 6 9-13.5");
    			add_location(path, file$4, 369, 36, 14513);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "stroke-width", "1.5");
    			attr_dev(svg, "stroke", "currentColor");
    			attr_dev(svg, "class", "w-5 h-5");
    			add_location(svg, file$4, 361, 32, 14098);
    			attr_dev(p, "class", "px-1");
    			add_location(p, file$4, 375, 32, 14822);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path);
    			insert_dev(target, t, anchor);
    			insert_dev(target, p, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$1.name,
    		type: "if",
    		source: "(361:28) {#if selectedSubTopics.includes(subTopic)}",
    		ctx
    	});

    	return block;
    }

    // (334:20) {#each availableSubTopics as subTopic, i}
    function create_each_block$2(ctx) {
    	let button;
    	let show_if = /*selectedSubTopics*/ ctx[4].includes(/*subTopic*/ ctx[21]);
    	let t0;
    	let t1_value = /*subTopic*/ ctx[21] + "";
    	let t1;
    	let t2;
    	let button_class_value;
    	let mounted;
    	let dispose;
    	let if_block = show_if && create_if_block_3$1(ctx);

    	function click_handler_8() {
    		return /*click_handler_8*/ ctx[18](/*subTopic*/ ctx[21]);
    	}

    	const block = {
    		c: function create() {
    			button = element("button");
    			if (if_block) if_block.c();
    			t0 = space();
    			t1 = text(t1_value);
    			t2 = space();

    			attr_dev(button, "class", button_class_value = "flex items-center px-4 py-2 " + (/*i*/ ctx[23] == 0 ? 'rounded-t-md' : '') + " " + (/*i*/ ctx[23] == /*availableSubTopics*/ ctx[5].length - 1
    			? 'rounded-b-md'
    			: '') + " w-full border-neutral-400 " + (/*i*/ ctx[23] != 0 ? 'border-t-[1px]' : '') + " text-left " + (/*selectedSubTopics*/ ctx[4].includes(/*subTopic*/ ctx[21])
    			? 'bg-violet-200'
    			: 'bg-gray-200'));

    			add_location(button, file$4, 334, 24, 12656);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			if (if_block) if_block.m(button, null);
    			append_dev(button, t0);
    			append_dev(button, t1);
    			append_dev(button, t2);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler_8, false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*selectedSubTopics, availableSubTopics*/ 48) show_if = /*selectedSubTopics*/ ctx[4].includes(/*subTopic*/ ctx[21]);

    			if (show_if) {
    				if (if_block) ; else {
    					if_block = create_if_block_3$1(ctx);
    					if_block.c();
    					if_block.m(button, t0);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*availableSubTopics*/ 32 && t1_value !== (t1_value = /*subTopic*/ ctx[21] + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*availableSubTopics, selectedSubTopics*/ 48 && button_class_value !== (button_class_value = "flex items-center px-4 py-2 " + (/*i*/ ctx[23] == 0 ? 'rounded-t-md' : '') + " " + (/*i*/ ctx[23] == /*availableSubTopics*/ ctx[5].length - 1
    			? 'rounded-b-md'
    			: '') + " w-full border-neutral-400 " + (/*i*/ ctx[23] != 0 ? 'border-t-[1px]' : '') + " text-left " + (/*selectedSubTopics*/ ctx[4].includes(/*subTopic*/ ctx[21])
    			? 'bg-violet-200'
    			: 'bg-gray-200'))) {
    				attr_dev(button, "class", button_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if (if_block) if_block.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(334:20) {#each availableSubTopics as subTopic, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$3, create_else_block$2];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*isLoading*/ ctx[7]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('HomePage', slots, []);
    	let createGameModal = false;
    	let showAccountDropdown = false;
    	let selectedButton = null;
    	let numQuestions = 1;
    	let selectedSubTopics = [];
    	let availableSubTopics = [];
    	let gameHistory = [];
    	let isLoading = false;

    	onMount(() => {
    		const uid = getCookie("uid");

    		if (!uid) {
    			console.log("User is not logged in");

    			// redirect to dashboard
    			push("/");
    		}

    		getGameHistory();
    	});

    	async function getGameHistory() {
    		try {
    			const uid = getCookie("uid");

    			const response = await fetch("http://localhost:3000" + "/user/" + uid + "/game-history", {
    				method: "GET",
    				headers: { "Content-Type": "application/json" }
    			});

    			const data = await response.json();
    			console.log(data);
    			$$invalidate(6, gameHistory = data["data"]);
    		} catch(error) {
    			console.log(error);
    		}
    	}

    	async function createGame() {
    		if (selectedSubTopics.length == 0) {
    			return;
    		}

    		try {
    			const uid = getCookie("uid");
    			$$invalidate(7, isLoading = true);

    			const response = await fetch("http://localhost:3000" + "/game/create", {
    				method: "POST",
    				headers: { "Content-Type": "application/json" },
    				body: JSON.stringify({
    					uid,
    					category: selectedSubTopics[0],
    					numQuestions,
    					difficulty: "easy"
    				})
    			});

    			let json = await response.json();
    			let data = json.data;

    			if (!data.success) {
    				console.log("Error creating game");
    				return;
    			}

    			$$invalidate(7, isLoading = false);
    			push("/play");
    		} catch(error) {
    			console.log(error);
    		}
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$4.warn(`<HomePage> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => $$invalidate(1, showAccountDropdown = !showAccountDropdown);

    	const click_handler_1 = () => {
    		$$invalidate(0, createGameModal = true);
    	};

    	const click_handler_2 = () => {
    		$$invalidate(0, createGameModal = false);
    	};

    	function input_change_input_handler() {
    		numQuestions = to_number(this.value);
    		$$invalidate(3, numQuestions);
    	}

    	const click_handler_3 = () => {
    		$$invalidate(2, selectedButton = "Math");
    		$$invalidate(5, availableSubTopics = mathSubTopics);
    	};

    	const click_handler_4 = () => {
    		$$invalidate(2, selectedButton = "Science");
    		$$invalidate(5, availableSubTopics = scienceSubTopics);
    	};

    	const click_handler_5 = () => {
    		$$invalidate(2, selectedButton = "English");
    		$$invalidate(5, availableSubTopics = englishSubTopics);
    	};

    	const click_handler_6 = () => {
    		$$invalidate(2, selectedButton = "History");
    		$$invalidate(5, availableSubTopics = historySubTopics);
    	};

    	const click_handler_7 = () => {
    		$$invalidate(2, selectedButton = "Miscellaneous");
    		$$invalidate(5, availableSubTopics = miscSubTopics);
    	};

    	const click_handler_8 = subTopic => {
    		if (selectedSubTopics.includes(subTopic)) {
    			delete selectedSubTopics[selectedSubTopics.indexOf(subTopic)];
    			$$invalidate(4, selectedSubTopics);
    		} else {
    			$$invalidate(4, selectedSubTopics = [
    				//...selectedSubTopics,
    				subTopic
    			]);
    		}
    	};

    	const click_handler_9 = async () => await createGame();

    	$$self.$capture_state = () => ({
    		fetch,
    		onMount,
    		Button,
    		AltButton,
    		TextInput,
    		mathSubTopics,
    		scienceSubTopics,
    		englishSubTopics,
    		historySubTopics,
    		miscSubTopics,
    		push,
    		getCookie,
    		Circle2,
    		createGameModal,
    		showAccountDropdown,
    		selectedButton,
    		numQuestions,
    		selectedSubTopics,
    		availableSubTopics,
    		gameHistory,
    		isLoading,
    		getGameHistory,
    		createGame
    	});

    	$$self.$inject_state = $$props => {
    		if ('createGameModal' in $$props) $$invalidate(0, createGameModal = $$props.createGameModal);
    		if ('showAccountDropdown' in $$props) $$invalidate(1, showAccountDropdown = $$props.showAccountDropdown);
    		if ('selectedButton' in $$props) $$invalidate(2, selectedButton = $$props.selectedButton);
    		if ('numQuestions' in $$props) $$invalidate(3, numQuestions = $$props.numQuestions);
    		if ('selectedSubTopics' in $$props) $$invalidate(4, selectedSubTopics = $$props.selectedSubTopics);
    		if ('availableSubTopics' in $$props) $$invalidate(5, availableSubTopics = $$props.availableSubTopics);
    		if ('gameHistory' in $$props) $$invalidate(6, gameHistory = $$props.gameHistory);
    		if ('isLoading' in $$props) $$invalidate(7, isLoading = $$props.isLoading);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		createGameModal,
    		showAccountDropdown,
    		selectedButton,
    		numQuestions,
    		selectedSubTopics,
    		availableSubTopics,
    		gameHistory,
    		isLoading,
    		createGame,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		input_change_input_handler,
    		click_handler_3,
    		click_handler_4,
    		click_handler_5,
    		click_handler_6,
    		click_handler_7,
    		click_handler_8,
    		click_handler_9
    	];
    }

    class HomePage extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "HomePage",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src/pages/PlayPage.svelte generated by Svelte v3.59.2 */

    const { console: console_1$3 } = globals;
    const file$3 = "src/pages/PlayPage.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[32] = list[i];
    	child_ctx[34] = i;
    	return child_ctx;
    }

    // (252:12) {#each options as option, i}
    function create_each_block$1(ctx) {
    	let li;
    	let button;
    	let p;
    	let t0_value = /*option*/ ctx[32] + "";
    	let t0;
    	let t1;
    	let mounted;
    	let dispose;

    	function click_handler_4() {
    		return /*click_handler_4*/ ctx[20](/*option*/ ctx[32]);
    	}

    	const block = {
    		c: function create() {
    			li = element("li");
    			button = element("button");
    			p = element("p");
    			t0 = text(t0_value);
    			t1 = space();
    			attr_dev(p, "class", "pl-7 pr-7 py-12");
    			add_location(p, file$3, 266, 24, 7872);
    			attr_dev(button, "class", "" + (/*colors*/ ctx[12][/*i*/ ctx[34]] + " w-full h-full hover:bg-opacity-90 active:bg-opacity-85 text-3xl text-white text-left border-b " + (/*i*/ ctx[34] === 0 ? 'rounded-tl-2xl' : '') + " " + (/*i*/ ctx[34] === 3 ? 'rounded-tr-2xl' : '') + " " + (/*i*/ ctx[34] === 0 ? 'rounded-bl-2xl' : '') + " " + (/*i*/ ctx[34] === 3 ? 'rounded-br-2xl' : '')));
    			add_location(button, file$3, 253, 20, 7223);
    			attr_dev(li, "class", "");
    			add_location(li, file$3, 252, 16, 7189);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, button);
    			append_dev(button, p);
    			append_dev(p, t0);
    			append_dev(li, t1);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler_4, false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty[0] & /*options*/ 2 && t0_value !== (t0_value = /*option*/ ctx[32] + "")) set_data_dev(t0, t0_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(252:12) {#each options as option, i}",
    		ctx
    	});

    	return block;
    }

    // (290:16) {:else}
    function create_else_block_3(ctx) {
    	let button;
    	let img;
    	let img_src_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			img = element("img");
    			if (!src_url_equal(img.src, img_src_value = "./assets/powerups/double_jeap_disabled.svg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Double Jeopardy");
    			attr_dev(img, "class", "w-7");
    			attr_dev(img, "style", "");
    			add_location(img, file$3, 294, 24, 8947);
    			attr_dev(button, "class", "cursor-not-allowed py-5 px-5 rounded-full bg-gray-200");
    			add_location(button, file$3, 290, 20, 8774);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, img);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[18], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_3.name,
    		type: "else",
    		source: "(290:16) {:else}",
    		ctx
    	});

    	return block;
    }

    // (276:16) {#if djAvail}
    function create_if_block_10(ctx) {
    	let button;
    	let img;
    	let img_src_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			img = element("img");
    			if (!src_url_equal(img.src, img_src_value = "./assets/powerups/double_jeap.svg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Double Jeopardy");
    			attr_dev(img, "class", "w-7");
    			attr_dev(img, "style", "");
    			add_location(img, file$3, 282, 24, 8473);
    			attr_dev(button, "class", "py-5 px-5 rounded-full bg-[#d4edda]");
    			add_location(button, file$3, 276, 20, 8210);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, img);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler_5*/ ctx[21], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_10.name,
    		type: "if",
    		source: "(276:16) {#if djAvail}",
    		ctx
    	});

    	return block;
    }

    // (315:16) {:else}
    function create_else_block_2(ctx) {
    	let button;
    	let img;
    	let img_src_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			img = element("img");
    			if (!src_url_equal(img.src, img_src_value = "./assets/powerups/2x_disabled.svg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "2x");
    			attr_dev(img, "class", "w-10");
    			add_location(img, file$3, 318, 25, 9923);
    			attr_dev(button, "class", "cursor-not-allowed py-2 px-3.5 rounded-full bg-gray-200");
    			add_location(button, file$3, 315, 20, 9769);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, img);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler_1*/ ctx[17], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_2.name,
    		type: "else",
    		source: "(315:16) {:else}",
    		ctx
    	});

    	return block;
    }

    // (303:16) {#if twoAvail}
    function create_if_block_9(ctx) {
    	let button;
    	let img;
    	let img_src_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			img = element("img");
    			if (!src_url_equal(img.src, img_src_value = "./assets/powerups/2x.svg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "2x");
    			attr_dev(img, "class", "w-10");
    			add_location(img, file$3, 308, 25, 9526);
    			attr_dev(button, "class", "py-2 px-3.5 rounded-full bg-[#cce5ff]");
    			add_location(button, file$3, 303, 20, 9286);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, img);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler_6*/ ctx[22], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_9.name,
    		type: "if",
    		source: "(303:16) {#if twoAvail}",
    		ctx
    	});

    	return block;
    }

    // (338:16) {:else}
    function create_else_block_1(ctx) {
    	let button;
    	let img;
    	let img_src_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			img = element("img");
    			if (!src_url_equal(img.src, img_src_value = "./assets/powerups/streak_boost_disabled.svg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "2x");
    			attr_dev(img, "class", "w-8");
    			add_location(img, file$3, 341, 25, 10855);
    			attr_dev(button, "class", "cursor-not-allowed py-2 px-[18px] rounded-full bg-gray-200");
    			add_location(button, file$3, 338, 20, 10698);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, img);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler_2*/ ctx[16], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(338:16) {:else}",
    		ctx
    	});

    	return block;
    }

    // (326:16) {#if psAvail}
    function create_if_block_8(ctx) {
    	let button;
    	let img;
    	let img_src_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			img = element("img");
    			if (!src_url_equal(img.src, img_src_value = "./assets/powerups/streak_boost.svg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "2x");
    			attr_dev(img, "class", "w-8");
    			add_location(img, file$3, 331, 25, 10446);
    			attr_dev(button, "class", "py-2 px-[18px] rounded-full bg-[#ede2d4]");
    			add_location(button, file$3, 326, 20, 10203);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, img);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler_7*/ ctx[23], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_8.name,
    		type: "if",
    		source: "(326:16) {#if psAvail}",
    		ctx
    	});

    	return block;
    }

    // (350:16) {#if activePowerup}
    function create_if_block_4(ctx) {
    	let div;
    	let h1;
    	let t1;

    	function select_block_type_3(ctx, dirty) {
    		if (/*activePowerup*/ ctx[7] === "double-jeaporady") return create_if_block_5;
    		if (/*activePowerup*/ ctx[7] === "double-score") return create_if_block_6;
    		if (/*activePowerup*/ ctx[7] === "streak-boost") return create_if_block_7;
    	}

    	let current_block_type = select_block_type_3(ctx);
    	let if_block = current_block_type && current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			h1 = element("h1");
    			h1.textContent = "Active Powerup:";
    			t1 = space();
    			if (if_block) if_block.c();
    			attr_dev(h1, "class", "text-2xl");
    			add_location(h1, file$3, 353, 24, 11290);
    			attr_dev(div, "class", "self-center ml-5 flex gap-2 items-center justify-center");
    			add_location(div, file$3, 350, 20, 11151);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h1);
    			append_dev(div, t1);
    			if (if_block) if_block.m(div, null);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type !== (current_block_type = select_block_type_3(ctx))) {
    				if (if_block) if_block.d(1);
    				if_block = current_block_type && current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div, null);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);

    			if (if_block) {
    				if_block.d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(350:16) {#if activePowerup}",
    		ctx
    	});

    	return block;
    }

    // (370:67) 
    function create_if_block_7(ctx) {
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			img = element("img");
    			if (!src_url_equal(img.src, img_src_value = "./assets/powerups/streak_boost.svg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "2x");
    			attr_dev(img, "class", "w-8");
    			attr_dev(img, "style", "");
    			add_location(img, file$3, 370, 28, 12195);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_7.name,
    		type: "if",
    		source: "(370:67) ",
    		ctx
    	});

    	return block;
    }

    // (363:67) 
    function create_if_block_6(ctx) {
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			img = element("img");
    			if (!src_url_equal(img.src, img_src_value = "./assets/powerups/2x.svg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "2x");
    			attr_dev(img, "class", "w-10");
    			attr_dev(img, "style", "");
    			add_location(img, file$3, 363, 28, 11873);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6.name,
    		type: "if",
    		source: "(363:67) ",
    		ctx
    	});

    	return block;
    }

    // (356:24) {#if activePowerup === "double-jeaporady"}
    function create_if_block_5(ctx) {
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			img = element("img");
    			if (!src_url_equal(img.src, img_src_value = "./assets/powerups/double_jeap.svg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Double Jeopardy");
    			attr_dev(img, "class", "w-7");
    			attr_dev(img, "style", "");
    			add_location(img, file$3, 356, 28, 11530);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(356:24) {#if activePowerup === \\\"double-jeaporady\\\"}",
    		ctx
    	});

    	return block;
    }

    // (390:0) {#if endScreenModal}
    function create_if_block$2(ctx) {
    	let div4;
    	let div3;
    	let div0;
    	let h20;
    	let t1;
    	let p0;
    	let t2;
    	let h21;
    	let t3;
    	let t4;
    	let t5;
    	let h22;
    	let t6;
    	let t7;
    	let t8;
    	let t9;
    	let t10;
    	let h23;
    	let t11;
    	let t12_value = Math.floor(/*numRight*/ ctx[4] / /*numQuestions*/ ctx[3] * 100) + "";
    	let t12;
    	let t13;
    	let t14;
    	let div1;
    	let t15;
    	let div2;
    	let p1;
    	let t16;
    	let button;
    	let current;

    	function select_block_type_4(ctx, dirty) {
    		if (/*numRight*/ ctx[4] / /*numQuestions*/ ctx[3] >= 0.8) return create_if_block_1$1;
    		if (/*numRight*/ ctx[4] / /*numQuestions*/ ctx[3] >= 0.6) return create_if_block_2;
    		if (/*numRight*/ ctx[4] / /*numQuestions*/ ctx[3] >= 0.4) return create_if_block_3;
    		return create_else_block$1;
    	}

    	let current_block_type = select_block_type_4(ctx);
    	let if_block = current_block_type(ctx);

    	button = new Button({
    			props: { label: "Return to Dashboard" },
    			$$inline: true
    		});

    	button.$on("click", /*click_handler_8*/ ctx[24]);

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			div3 = element("div");
    			div0 = element("div");
    			h20 = element("h2");
    			h20.textContent = "Game Over!";
    			t1 = space();
    			p0 = element("p");
    			t2 = space();
    			h21 = element("h2");
    			t3 = text("Score: ");
    			t4 = text(/*score*/ ctx[5]);
    			t5 = space();
    			h22 = element("h2");
    			t6 = text("Questions: ");
    			t7 = text(/*numRight*/ ctx[4]);
    			t8 = text("/");
    			t9 = text(/*numQuestions*/ ctx[3]);
    			t10 = space();
    			h23 = element("h2");
    			t11 = text("(Percent: ");
    			t12 = text(t12_value);
    			t13 = text("%)");
    			t14 = space();
    			div1 = element("div");
    			if_block.c();
    			t15 = space();
    			div2 = element("div");
    			p1 = element("p");
    			t16 = space();
    			create_component(button.$$.fragment);
    			attr_dev(h20, "class", "text-3xl font-bold font-vag text-center");
    			add_location(h20, file$3, 395, 16, 13024);
    			attr_dev(div0, "class", "flex items-center justify-center px-40");
    			add_location(div0, file$3, 394, 12, 12955);
    			attr_dev(p0, "class", "py-3");
    			add_location(p0, file$3, 400, 12, 13209);
    			attr_dev(h21, "class", "text-2xl text-center");
    			add_location(h21, file$3, 401, 12, 13242);
    			attr_dev(h22, "class", "text-2xl text-center");
    			add_location(h22, file$3, 404, 12, 13337);
    			attr_dev(h23, "class", "text-xl text-center");
    			add_location(h23, file$3, 407, 12, 13454);
    			add_location(div1, file$3, 411, 12, 13592);
    			attr_dev(p1, "class", "py-3");
    			add_location(p1, file$3, 435, 16, 14613);
    			add_location(div2, file$3, 434, 12, 14591);
    			attr_dev(div3, "class", "bg-white p-10 rounded-md flex flex-col items-center");
    			add_location(div3, file$3, 393, 8, 12877);
    			attr_dev(div4, "class", "fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex justify-center items-center");
    			add_location(div4, file$3, 390, 4, 12753);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div3);
    			append_dev(div3, div0);
    			append_dev(div0, h20);
    			append_dev(div3, t1);
    			append_dev(div3, p0);
    			append_dev(div3, t2);
    			append_dev(div3, h21);
    			append_dev(h21, t3);
    			append_dev(h21, t4);
    			append_dev(div3, t5);
    			append_dev(div3, h22);
    			append_dev(h22, t6);
    			append_dev(h22, t7);
    			append_dev(h22, t8);
    			append_dev(h22, t9);
    			append_dev(div3, t10);
    			append_dev(div3, h23);
    			append_dev(h23, t11);
    			append_dev(h23, t12);
    			append_dev(h23, t13);
    			append_dev(div3, t14);
    			append_dev(div3, div1);
    			if_block.m(div1, null);
    			append_dev(div3, t15);
    			append_dev(div3, div2);
    			append_dev(div2, p1);
    			append_dev(div2, t16);
    			mount_component(button, div2, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty[0] & /*score*/ 32) set_data_dev(t4, /*score*/ ctx[5]);
    			if (!current || dirty[0] & /*numRight*/ 16) set_data_dev(t7, /*numRight*/ ctx[4]);
    			if (!current || dirty[0] & /*numQuestions*/ 8) set_data_dev(t9, /*numQuestions*/ ctx[3]);
    			if ((!current || dirty[0] & /*numRight, numQuestions*/ 24) && t12_value !== (t12_value = Math.floor(/*numRight*/ ctx[4] / /*numQuestions*/ ctx[3] * 100) + "")) set_data_dev(t12, t12_value);

    			if (current_block_type !== (current_block_type = select_block_type_4(ctx))) {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div1, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    			if_block.d();
    			destroy_component(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(390:0) {#if endScreenModal}",
    		ctx
    	});

    	return block;
    }

    // (428:16) {:else}
    function create_else_block$1(ctx) {
    	let p;
    	let t0;
    	let h2;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t0 = space();
    			h2 = element("h2");
    			h2.textContent = "You suck! Get better.";
    			attr_dev(p, "class", "py-3");
    			add_location(p, file$3, 428, 20, 14378);
    			attr_dev(h2, "class", "text-2xl text-center text-red-500");
    			add_location(h2, file$3, 429, 20, 14419);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, h2, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(h2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(428:16) {:else}",
    		ctx
    	});

    	return block;
    }

    // (423:57) 
    function create_if_block_3(ctx) {
    	let p;
    	let t0;
    	let h2;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t0 = space();
    			h2 = element("h2");
    			h2.textContent = "You can do better. Keep practicing.";
    			attr_dev(p, "class", "py-3");
    			add_location(p, file$3, 423, 20, 14157);
    			attr_dev(h2, "class", "text-2xl text-center text-orange-400");
    			add_location(h2, file$3, 424, 20, 14198);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, h2, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(h2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(423:57) ",
    		ctx
    	});

    	return block;
    }

    // (418:57) 
    function create_if_block_2(ctx) {
    	let p;
    	let t0;
    	let h2;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t0 = space();
    			h2 = element("h2");
    			h2.textContent = "Not bad! Keep practicing.";
    			attr_dev(p, "class", "py-3");
    			add_location(p, file$3, 418, 20, 13914);
    			attr_dev(h2, "class", "text-2xl text-center text-blue-600");
    			add_location(h2, file$3, 419, 20, 13955);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, h2, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(h2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(418:57) ",
    		ctx
    	});

    	return block;
    }

    // (413:16) {#if numRight / numQuestions >= 0.8}
    function create_if_block_1$1(ctx) {
    	let p;
    	let t0;
    	let h2;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t0 = space();
    			h2 = element("h2");
    			h2.textContent = "Great job! Keep it up :)";
    			attr_dev(p, "class", "py-3");
    			add_location(p, file$3, 413, 20, 13671);
    			attr_dev(h2, "class", "text-2xl text-center text-green-500");
    			add_location(h2, file$3, 414, 20, 13712);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, h2, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(h2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(413:16) {#if numRight / numQuestions >= 0.8}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let header;
    	let div0;
    	let a;
    	let img;
    	let img_src_value;
    	let t0;
    	let nav;
    	let ul0;
    	let altbutton;
    	let t1;
    	let div6;
    	let div5;
    	let div1;
    	let h10;
    	let t2;
    	let t3;
    	let t4;
    	let t5;
    	let t6;
    	let h11;
    	let t7;
    	let t8;
    	let t9;
    	let h2;
    	let t10;
    	let t11;
    	let ul1;
    	let t12;
    	let div4;
    	let div2;
    	let t13;
    	let t14;
    	let t15;
    	let t16;
    	let div3;
    	let h12;
    	let t17;
    	let t18;
    	let t19;
    	let if_block4_anchor;
    	let current;

    	altbutton = new AltButton({
    			props: {
    				label: "Exit Game",
    				color: "#dc3545",
    				textColor: "white"
    			},
    			$$inline: true
    		});

    	altbutton.$on("click", /*click_handler_3*/ ctx[19]);
    	let each_value = /*options*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	function select_block_type(ctx, dirty) {
    		if (/*djAvail*/ ctx[8]) return create_if_block_10;
    		return create_else_block_3;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type(ctx);

    	function select_block_type_1(ctx, dirty) {
    		if (/*twoAvail*/ ctx[9]) return create_if_block_9;
    		return create_else_block_2;
    	}

    	let current_block_type_1 = select_block_type_1(ctx);
    	let if_block1 = current_block_type_1(ctx);

    	function select_block_type_2(ctx, dirty) {
    		if (/*psAvail*/ ctx[10]) return create_if_block_8;
    		return create_else_block_1;
    	}

    	let current_block_type_2 = select_block_type_2(ctx);
    	let if_block2 = current_block_type_2(ctx);
    	let if_block3 = /*activePowerup*/ ctx[7] && create_if_block_4(ctx);
    	let if_block4 = /*endScreenModal*/ ctx[11] && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			header = element("header");
    			div0 = element("div");
    			a = element("a");
    			img = element("img");
    			t0 = space();
    			nav = element("nav");
    			ul0 = element("ul");
    			create_component(altbutton.$$.fragment);
    			t1 = space();
    			div6 = element("div");
    			div5 = element("div");
    			div1 = element("div");
    			h10 = element("h1");
    			t2 = text("Question ");
    			t3 = text(/*questionNumber*/ ctx[2]);
    			t4 = text("/");
    			t5 = text(/*numQuestions*/ ctx[3]);
    			t6 = space();
    			h11 = element("h1");
    			t7 = text("Score: ");
    			t8 = text(/*score*/ ctx[5]);
    			t9 = space();
    			h2 = element("h2");
    			t10 = text(/*question*/ ctx[0]);
    			t11 = space();
    			ul1 = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t12 = space();
    			div4 = element("div");
    			div2 = element("div");
    			if_block0.c();
    			t13 = space();
    			if_block1.c();
    			t14 = space();
    			if_block2.c();
    			t15 = space();
    			if (if_block3) if_block3.c();
    			t16 = space();
    			div3 = element("div");
    			h12 = element("h1");
    			t17 = text("Streak: ");
    			t18 = text(/*streak*/ ctx[6]);
    			t19 = space();
    			if (if_block4) if_block4.c();
    			if_block4_anchor = empty();
    			if (!src_url_equal(img.src, img_src_value = "./assets/logo_expanded.svg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "logo");
    			attr_dev(img, "class", "w-60");
    			add_location(img, file$3, 219, 12, 6062);
    			attr_dev(a, "href", "/");
    			add_location(a, file$3, 218, 8, 6037);
    			attr_dev(div0, "class", "flex");
    			add_location(div0, file$3, 217, 4, 6010);
    			attr_dev(ul0, "class", "flex items-center");
    			add_location(ul0, file$3, 223, 8, 6169);
    			add_location(nav, file$3, 222, 4, 6155);
    			attr_dev(header, "class", "flex justify-between p-10 items-center");
    			add_location(header, file$3, 215, 0, 5934);
    			attr_dev(h10, "class", "text-2xl mb-10");
    			add_location(h10, file$3, 244, 12, 6856);
    			attr_dev(h11, "class", "text-2xl mb-10");
    			add_location(h11, file$3, 247, 12, 6971);
    			attr_dev(div1, "class", "flex justify-between");
    			add_location(div1, file$3, 243, 8, 6809);
    			attr_dev(h2, "class", "text-6xl mb-10");
    			add_location(h2, file$3, 249, 8, 7041);
    			attr_dev(ul1, "class", "grid grid-cols-4 gap-[1px]");
    			add_location(ul1, file$3, 250, 8, 7092);
    			attr_dev(div2, "class", "flex gap-2 justify-center");
    			add_location(div2, file$3, 274, 12, 8120);
    			attr_dev(h12, "class", "text-2xl");
    			add_location(h12, file$3, 381, 16, 12575);
    			attr_dev(div3, "class", "flex");
    			add_location(div3, file$3, 380, 12, 12540);
    			attr_dev(div4, "class", "flex mt-10 -mb-8 justify-between items-center");
    			add_location(div4, file$3, 273, 8, 8048);
    			attr_dev(div5, "class", "p-20 pt-10 bg-white rounded-2xl shadow-lg");
    			add_location(div5, file$3, 241, 4, 6645);
    			attr_dev(div6, "class", "flex flex-col items-center justify-center bg-gray-100 p-10 overflow-hidden");
    			add_location(div6, file$3, 238, 0, 6547);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, header, anchor);
    			append_dev(header, div0);
    			append_dev(div0, a);
    			append_dev(a, img);
    			append_dev(header, t0);
    			append_dev(header, nav);
    			append_dev(nav, ul0);
    			mount_component(altbutton, ul0, null);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div6, anchor);
    			append_dev(div6, div5);
    			append_dev(div5, div1);
    			append_dev(div1, h10);
    			append_dev(h10, t2);
    			append_dev(h10, t3);
    			append_dev(h10, t4);
    			append_dev(h10, t5);
    			append_dev(div1, t6);
    			append_dev(div1, h11);
    			append_dev(h11, t7);
    			append_dev(h11, t8);
    			append_dev(div5, t9);
    			append_dev(div5, h2);
    			append_dev(h2, t10);
    			append_dev(div5, t11);
    			append_dev(div5, ul1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(ul1, null);
    				}
    			}

    			append_dev(div5, t12);
    			append_dev(div5, div4);
    			append_dev(div4, div2);
    			if_block0.m(div2, null);
    			append_dev(div2, t13);
    			if_block1.m(div2, null);
    			append_dev(div2, t14);
    			if_block2.m(div2, null);
    			append_dev(div2, t15);
    			if (if_block3) if_block3.m(div2, null);
    			append_dev(div4, t16);
    			append_dev(div4, div3);
    			append_dev(div3, h12);
    			append_dev(h12, t17);
    			append_dev(h12, t18);
    			insert_dev(target, t19, anchor);
    			if (if_block4) if_block4.m(target, anchor);
    			insert_dev(target, if_block4_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty[0] & /*questionNumber*/ 4) set_data_dev(t3, /*questionNumber*/ ctx[2]);
    			if (!current || dirty[0] & /*numQuestions*/ 8) set_data_dev(t5, /*numQuestions*/ ctx[3]);
    			if (!current || dirty[0] & /*score*/ 32) set_data_dev(t8, /*score*/ ctx[5]);
    			if (!current || dirty[0] & /*question*/ 1) set_data_dev(t10, /*question*/ ctx[0]);

    			if (dirty[0] & /*colors, selectOption, options*/ 20482) {
    				each_value = /*options*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block0) {
    				if_block0.p(ctx, dirty);
    			} else {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(div2, t13);
    				}
    			}

    			if (current_block_type_1 === (current_block_type_1 = select_block_type_1(ctx)) && if_block1) {
    				if_block1.p(ctx, dirty);
    			} else {
    				if_block1.d(1);
    				if_block1 = current_block_type_1(ctx);

    				if (if_block1) {
    					if_block1.c();
    					if_block1.m(div2, t14);
    				}
    			}

    			if (current_block_type_2 === (current_block_type_2 = select_block_type_2(ctx)) && if_block2) {
    				if_block2.p(ctx, dirty);
    			} else {
    				if_block2.d(1);
    				if_block2 = current_block_type_2(ctx);

    				if (if_block2) {
    					if_block2.c();
    					if_block2.m(div2, t15);
    				}
    			}

    			if (/*activePowerup*/ ctx[7]) {
    				if (if_block3) {
    					if_block3.p(ctx, dirty);
    				} else {
    					if_block3 = create_if_block_4(ctx);
    					if_block3.c();
    					if_block3.m(div2, null);
    				}
    			} else if (if_block3) {
    				if_block3.d(1);
    				if_block3 = null;
    			}

    			if (!current || dirty[0] & /*streak*/ 64) set_data_dev(t18, /*streak*/ ctx[6]);

    			if (/*endScreenModal*/ ctx[11]) {
    				if (if_block4) {
    					if_block4.p(ctx, dirty);

    					if (dirty[0] & /*endScreenModal*/ 2048) {
    						transition_in(if_block4, 1);
    					}
    				} else {
    					if_block4 = create_if_block$2(ctx);
    					if_block4.c();
    					transition_in(if_block4, 1);
    					if_block4.m(if_block4_anchor.parentNode, if_block4_anchor);
    				}
    			} else if (if_block4) {
    				group_outros();

    				transition_out(if_block4, 1, 1, () => {
    					if_block4 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(altbutton.$$.fragment, local);
    			transition_in(if_block4);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(altbutton.$$.fragment, local);
    			transition_out(if_block4);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(header);
    			destroy_component(altbutton);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div6);
    			destroy_each(each_blocks, detaching);
    			if_block0.d();
    			if_block1.d();
    			if_block2.d();
    			if (if_block3) if_block3.d();
    			if (detaching) detach_dev(t19);
    			if (if_block4) if_block4.d(detaching);
    			if (detaching) detach_dev(if_block4_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('PlayPage', slots, []);
    	let gid;
    	let questionsArray = [];
    	let question = "What is the capital of France?";
    	let options = ["Paris", "London", "Berlin", "Madrid"];
    	let correctOption = "Paris";
    	let colors = ["bg-fuchsia-900", "bg-purple-900", "bg-violet-950", "bg-indigo-950"];
    	let questionNumber = 1;
    	let numQuestions = 0;
    	let numRight = 0;
    	let score = 0;
    	let streak = 0;
    	let activePowerup = "";
    	let djAvail = false;
    	let twoAvail = false;
    	let psAvail = false;
    	let endScreenModal = false;

    	onMount(async () => {
    		const uid = getCookie$1("uid");

    		if (!uid) {
    			console.log("User is not logged in");

    			// redirect to dashboard
    			push("/");

    			return;
    		}

    		// fetch current game id
    		gid = await fetchCurrentGame(uid);

    		if (!gid) {
    			console.log("User is not in a game");
    			push("/");
    			return;
    		}

    		questionsArray = await fetchQuestions(gid);
    		console.log(questionsArray);
    		await loadQuestion(1);
    	});

    	async function loadQuestion(num) {
    		$$invalidate(0, question = questionsArray[num - 1].question);
    		$$invalidate(1, options = questionsArray[num - 1].choices);
    		$$invalidate(3, numQuestions = questionsArray.length);
    		correctOption = questionsArray[num - 1].answer;
    	}

    	async function endGame() {
    		try {
    			await fetch("http://localhost:3000" + "/game/" + gid + "/end", {
    				method: "GET",
    				headers: { "Content-Type": "application/json" }
    			});
    		} catch(error) {
    			console.log(error);
    		}
    	}

    	async function fetchCurrentGame(uid) {
    		try {
    			const response = await fetch("http://localhost:3000" + "/user/" + uid, {
    				method: "GET",
    				headers: { "Content-Type": "application/json" }
    			});

    			let json = await response.json();
    			let data = json.data;
    			return data["current-game"];
    		} catch(error) {
    			console.error(error);
    		}
    	}

    	async function fetchQuestions(gid) {
    		try {
    			const response = await fetch("http://localhost:3000" + "/game/" + gid, {
    				method: "GET",
    				headers: { "Content-Type": "application/json" }
    			});

    			const json = await response.json();
    			let data = json.data;
    			return JSON.parse(data.questions);
    		} catch(error) {
    			console.error(error);
    		}
    	}

    	async function processPowerups(powerupsAdded) {
    		$$invalidate(7, activePowerup = "");

    		for (let powerup in powerupsAdded) {
    			powerup = powerupsAdded[powerup].toLowerCase();
    			console.log(powerup);

    			if (powerup === "double-jeaporady") {
    				$$invalidate(8, djAvail = true);
    			} else if (powerup === "double-score") {
    				$$invalidate(9, twoAvail = true);
    			} else if (powerup === "streak-boost") {
    				$$invalidate(10, psAvail = true);
    			}
    		}
    	}

    	async function selectOption(option) {
    		try {
    			const uid = getCookie$1("uid");
    			const correct = option.toLowerCase() === correctOption.toLowerCase();
    			if (correct) $$invalidate(4, numRight++, numRight);
    			const endpoint = "http://localhost:3000" + "/user/" + uid + "/" + (correct ? "correctanswer" : "incorrectanswer");

    			const response = await fetch(endpoint, {
    				method: "GET",
    				headers: { "Content-Type": "application/json" }
    			});

    			const json = await response.json();
    			let data = json.data;
    			$$invalidate(5, score = data.score);
    			$$invalidate(6, streak = data.streak);
    			await processPowerups(data.powerupsAdded);

    			if (questionNumber < numQuestions) {
    				$$invalidate(2, questionNumber++, questionNumber);
    				await loadQuestion(questionNumber);
    			} else {
    				console.log("game over");
    				$$invalidate(11, endScreenModal = true);
    			}
    		} catch(error) {
    			console.error(error);
    		}
    	}

    	async function usePowerup(powerup) {
    		try {
    			const endpoint = "http://localhost:3000" + "/game/activate-powerup/";

    			const response = await fetch(endpoint, {
    				method: "POST",
    				headers: { "Content-Type": "application/json" },
    				body: JSON.stringify({ powerup, gid })
    			});

    			const json = await response.json();
    			let data = json.data;

    			if (data.success) {
    				console.log("powerup activated");
    				$$invalidate(7, activePowerup = powerup);

    				if (powerup === "double-jeaporady") {
    					$$invalidate(8, djAvail = false);
    				} else if (powerup === "double-score") {
    					$$invalidate(9, twoAvail = false);
    				} else if (powerup === "streak-boost") {
    					$$invalidate(10, psAvail = false);
    				}
    			} else {
    				console.log("powerup failed to activate: " + data);
    			}
    		} catch(error) {
    			console.error(error);
    		}
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$3.warn(`<PlayPage> was created with unknown prop '${key}'`);
    	});

    	function click_handler_2(event) {
    		bubble.call(this, $$self, event);
    	}

    	function click_handler_1(event) {
    		bubble.call(this, $$self, event);
    	}

    	function click_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	const click_handler_3 = async () => {
    		await endGame();
    		push("/");
    		window.location.reload();
    	};

    	const click_handler_4 = async option => {
    		await selectOption(option);
    	};

    	const click_handler_5 = async () => {
    		await usePowerup("double-jeaporady");
    	};

    	const click_handler_6 = async () => {
    		await usePowerup("double-score");
    	};

    	const click_handler_7 = async () => {
    		await usePowerup("streak-boost");
    	};

    	const click_handler_8 = async () => {
    		await endGame();
    		push("/");
    		window.location.reload();
    	};

    	$$self.$capture_state = () => ({
    		Button,
    		getCookie: getCookie$1,
    		onMount,
    		AltButton,
    		push,
    		fetch,
    		gid,
    		questionsArray,
    		question,
    		options,
    		correctOption,
    		colors,
    		questionNumber,
    		numQuestions,
    		numRight,
    		score,
    		streak,
    		activePowerup,
    		djAvail,
    		twoAvail,
    		psAvail,
    		endScreenModal,
    		loadQuestion,
    		endGame,
    		fetchCurrentGame,
    		fetchQuestions,
    		processPowerups,
    		selectOption,
    		usePowerup
    	});

    	$$self.$inject_state = $$props => {
    		if ('gid' in $$props) gid = $$props.gid;
    		if ('questionsArray' in $$props) questionsArray = $$props.questionsArray;
    		if ('question' in $$props) $$invalidate(0, question = $$props.question);
    		if ('options' in $$props) $$invalidate(1, options = $$props.options);
    		if ('correctOption' in $$props) correctOption = $$props.correctOption;
    		if ('colors' in $$props) $$invalidate(12, colors = $$props.colors);
    		if ('questionNumber' in $$props) $$invalidate(2, questionNumber = $$props.questionNumber);
    		if ('numQuestions' in $$props) $$invalidate(3, numQuestions = $$props.numQuestions);
    		if ('numRight' in $$props) $$invalidate(4, numRight = $$props.numRight);
    		if ('score' in $$props) $$invalidate(5, score = $$props.score);
    		if ('streak' in $$props) $$invalidate(6, streak = $$props.streak);
    		if ('activePowerup' in $$props) $$invalidate(7, activePowerup = $$props.activePowerup);
    		if ('djAvail' in $$props) $$invalidate(8, djAvail = $$props.djAvail);
    		if ('twoAvail' in $$props) $$invalidate(9, twoAvail = $$props.twoAvail);
    		if ('psAvail' in $$props) $$invalidate(10, psAvail = $$props.psAvail);
    		if ('endScreenModal' in $$props) $$invalidate(11, endScreenModal = $$props.endScreenModal);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		question,
    		options,
    		questionNumber,
    		numQuestions,
    		numRight,
    		score,
    		streak,
    		activePowerup,
    		djAvail,
    		twoAvail,
    		psAvail,
    		endScreenModal,
    		colors,
    		endGame,
    		selectOption,
    		usePowerup,
    		click_handler_2,
    		click_handler_1,
    		click_handler,
    		click_handler_3,
    		click_handler_4,
    		click_handler_5,
    		click_handler_6,
    		click_handler_7,
    		click_handler_8
    	];
    }

    class PlayPage extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {}, null, [-1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "PlayPage",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src/pages/Leaderboard.svelte generated by Svelte v3.59.2 */

    const { console: console_1$2 } = globals;
    const file$2 = "src/pages/Leaderboard.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i].name;
    	child_ctx[4] = list[i].score;
    	child_ctx[6] = i;
    	return child_ctx;
    }

    // (131:12) {#each leaderboard as { name, score }
    function create_each_block(ctx) {
    	let tr;
    	let td0;
    	let t0_value = /*name*/ ctx[3] + "";
    	let t0;
    	let t1;
    	let td1;
    	let t2_value = /*score*/ ctx[4] + "";
    	let t2;
    	let t3;

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			td0 = element("td");
    			t0 = text(t0_value);
    			t1 = space();
    			td1 = element("td");
    			t2 = text(t2_value);
    			t3 = space();
    			attr_dev(td0, "class", "border-gray-300 px-4 py-2");
    			add_location(td0, file$2, 136, 20, 4729);
    			attr_dev(td1, "class", "border-gray-300 text-center px-4 py-2");
    			add_location(td1, file$2, 137, 20, 4799);
    			attr_dev(tr, "class", "table table-fixed w-[100%] " + (/*i*/ ctx[6] % 2 == 0 ? 'bg-gray-200' : ''));
    			add_location(tr, file$2, 131, 16, 4550);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td0);
    			append_dev(td0, t0);
    			append_dev(tr, t1);
    			append_dev(tr, td1);
    			append_dev(td1, t2);
    			append_dev(tr, t3);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*leaderboard*/ 1 && t0_value !== (t0_value = /*name*/ ctx[3] + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*leaderboard*/ 1 && t2_value !== (t2_value = /*score*/ ctx[4] + "")) set_data_dev(t2, t2_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(131:12) {#each leaderboard as { name, score }",
    		ctx
    	});

    	return block;
    }

    // (149:0) {#if showAccountDropdown}
    function create_if_block$1(ctx) {
    	let div;
    	let ul;
    	let li0;
    	let a0;
    	let t1;
    	let li1;
    	let a1;

    	const block = {
    		c: function create() {
    			div = element("div");
    			ul = element("ul");
    			li0 = element("li");
    			a0 = element("a");
    			a0.textContent = "Account";
    			t1 = space();
    			li1 = element("li");
    			a1 = element("a");
    			a1.textContent = "Logout";
    			attr_dev(a0, "href", "/#/account");
    			add_location(a0, file$2, 154, 16, 5231);
    			attr_dev(li0, "class", "py-2");
    			add_location(li0, file$2, 153, 12, 5197);
    			attr_dev(a1, "href", "/#/logout");
    			add_location(a1, file$2, 157, 16, 5328);
    			attr_dev(li1, "class", "py-2");
    			add_location(li1, file$2, 156, 12, 5294);
    			add_location(ul, file$2, 152, 8, 5180);
    			attr_dev(div, "class", "fixed top-0 right-0 mt-[7rem] mr-10 bg-white p-5 rounded-md shadow-lg");
    			add_location(div, file$2, 149, 4, 5075);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, ul);
    			append_dev(ul, li0);
    			append_dev(li0, a0);
    			append_dev(ul, t1);
    			append_dev(ul, li1);
    			append_dev(li1, a1);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(149:0) {#if showAccountDropdown}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let header;
    	let div0;
    	let a0;
    	let img0;
    	let img0_src_value;
    	let t0;
    	let nav;
    	let ul;
    	let li0;
    	let a1;
    	let t2;
    	let li1;
    	let t3;
    	let li2;
    	let a2;
    	let t5;
    	let li3;
    	let t6;
    	let li4;
    	let a3;
    	let t8;
    	let li5;
    	let t9;
    	let li6;
    	let button;
    	let img1;
    	let img1_src_value;
    	let t10;
    	let p0;
    	let t11;
    	let svg;
    	let path;
    	let t12;
    	let div1;
    	let h1;
    	let t14;
    	let table;
    	let thead;
    	let tr;
    	let th0;
    	let t16;
    	let th1;
    	let t18;
    	let tbody;
    	let t19;
    	let p1;
    	let t20;
    	let if_block_anchor;
    	let mounted;
    	let dispose;
    	let each_value = /*leaderboard*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	let if_block = /*showAccountDropdown*/ ctx[1] && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			header = element("header");
    			div0 = element("div");
    			a0 = element("a");
    			img0 = element("img");
    			t0 = space();
    			nav = element("nav");
    			ul = element("ul");
    			li0 = element("li");
    			a1 = element("a");
    			a1.textContent = "Home";
    			t2 = space();
    			li1 = element("li");
    			t3 = space();
    			li2 = element("li");
    			a2 = element("a");
    			a2.textContent = "Leaderboard";
    			t5 = space();
    			li3 = element("li");
    			t6 = space();
    			li4 = element("li");
    			a3 = element("a");
    			a3.textContent = "About";
    			t8 = space();
    			li5 = element("li");
    			t9 = space();
    			li6 = element("li");
    			button = element("button");
    			img1 = element("img");
    			t10 = space();
    			p0 = element("p");
    			t11 = space();
    			svg = svg_element("svg");
    			path = svg_element("path");
    			t12 = space();
    			div1 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Leaderboard";
    			t14 = space();
    			table = element("table");
    			thead = element("thead");
    			tr = element("tr");
    			th0 = element("th");
    			th0.textContent = "Name";
    			t16 = space();
    			th1 = element("th");
    			th1.textContent = "Score";
    			t18 = space();
    			tbody = element("tbody");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t19 = space();
    			p1 = element("p");
    			t20 = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			if (!src_url_equal(img0.src, img0_src_value = "./assets/logo_expanded.svg")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "logo");
    			attr_dev(img0, "class", "w-60");
    			add_location(img0, file$2, 76, 12, 2506);
    			attr_dev(a0, "href", "/");
    			add_location(a0, file$2, 75, 8, 2481);
    			attr_dev(div0, "class", "flex");
    			add_location(div0, file$2, 74, 4, 2454);
    			attr_dev(a1, "href", "/");
    			add_location(a1, file$2, 81, 34, 2678);
    			attr_dev(li0, "class", "font-bold");
    			add_location(li0, file$2, 81, 12, 2656);
    			attr_dev(li1, "class", "px-2");
    			add_location(li1, file$2, 82, 12, 2716);
    			attr_dev(a2, "href", "/#/leaderboard");
    			add_location(a2, file$2, 83, 34, 2773);
    			attr_dev(li2, "class", "font-bold");
    			add_location(li2, file$2, 83, 12, 2751);
    			attr_dev(li3, "class", "px-2");
    			add_location(li3, file$2, 84, 12, 2831);
    			attr_dev(a3, "href", "/about");
    			add_location(a3, file$2, 85, 34, 2888);
    			attr_dev(li4, "class", "font-bold");
    			add_location(li4, file$2, 85, 12, 2866);
    			attr_dev(li5, "class", "px-2");
    			add_location(li5, file$2, 86, 12, 2932);
    			if (!src_url_equal(img1.src, img1_src_value = "../../assets/account.png")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "user");
    			attr_dev(img1, "class", "w-10");
    			add_location(img1, file$2, 93, 20, 3204);
    			attr_dev(p0, "class", "px-1");
    			add_location(p0, file$2, 98, 20, 3379);
    			attr_dev(path, "stroke-linecap", "round");
    			attr_dev(path, "stroke-linejoin", "round");
    			attr_dev(path, "d", "m19.5 8.25-7.5 7.5-7.5-7.5");
    			add_location(path, file$2, 107, 24, 3739);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "stroke-width", "1.5");
    			attr_dev(svg, "stroke", "currentColor");
    			attr_dev(svg, "class", "w-6 h-6");
    			add_location(svg, file$2, 99, 20, 3420);
    			attr_dev(button, "class", "flex items-center");
    			add_location(button, file$2, 88, 16, 3006);
    			attr_dev(li6, "class", "font-bold");
    			add_location(li6, file$2, 87, 12, 2967);
    			attr_dev(ul, "class", "flex items-center");
    			add_location(ul, file$2, 80, 8, 2613);
    			add_location(nav, file$2, 79, 4, 2599);
    			attr_dev(header, "class", "flex justify-between p-10 items-center");
    			add_location(header, file$2, 72, 0, 2378);
    			attr_dev(h1, "class", "text-4xl font-bold mb-4 font-vag");
    			add_location(h1, file$2, 120, 4, 4082);
    			attr_dev(th0, "class", "px-4 py-2");
    			add_location(th0, file$2, 124, 16, 4266);
    			attr_dev(th1, "class", "px-4 py-2");
    			add_location(th1, file$2, 125, 16, 4314);
    			add_location(tr, file$2, 123, 12, 4245);
    			attr_dev(thead, "class", "table table-fixed w-[100%]");
    			add_location(thead, file$2, 122, 8, 4190);
    			attr_dev(tbody, "class", "h-[32rem] overflow-auto block");
    			add_location(tbody, file$2, 129, 8, 4434);
    			attr_dev(table, "class", "table-auto w-full");
    			add_location(table, file$2, 121, 4, 4148);
    			attr_dev(p1, "class", "py-10");
    			add_location(p1, file$2, 145, 4, 5015);
    			attr_dev(div1, "class", "container mx-auto px-4");
    			add_location(div1, file$2, 119, 0, 4041);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, header, anchor);
    			append_dev(header, div0);
    			append_dev(div0, a0);
    			append_dev(a0, img0);
    			append_dev(header, t0);
    			append_dev(header, nav);
    			append_dev(nav, ul);
    			append_dev(ul, li0);
    			append_dev(li0, a1);
    			append_dev(ul, t2);
    			append_dev(ul, li1);
    			append_dev(ul, t3);
    			append_dev(ul, li2);
    			append_dev(li2, a2);
    			append_dev(ul, t5);
    			append_dev(ul, li3);
    			append_dev(ul, t6);
    			append_dev(ul, li4);
    			append_dev(li4, a3);
    			append_dev(ul, t8);
    			append_dev(ul, li5);
    			append_dev(ul, t9);
    			append_dev(ul, li6);
    			append_dev(li6, button);
    			append_dev(button, img1);
    			append_dev(button, t10);
    			append_dev(button, p0);
    			append_dev(button, t11);
    			append_dev(button, svg);
    			append_dev(svg, path);
    			insert_dev(target, t12, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, h1);
    			append_dev(div1, t14);
    			append_dev(div1, table);
    			append_dev(table, thead);
    			append_dev(thead, tr);
    			append_dev(tr, th0);
    			append_dev(tr, t16);
    			append_dev(tr, th1);
    			append_dev(table, t18);
    			append_dev(table, tbody);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(tbody, null);
    				}
    			}

    			append_dev(div1, t19);
    			append_dev(div1, p1);
    			insert_dev(target, t20, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[2], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*leaderboard*/ 1) {
    				each_value = /*leaderboard*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(tbody, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (/*showAccountDropdown*/ ctx[1]) {
    				if (if_block) ; else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(header);
    			if (detaching) detach_dev(t12);
    			if (detaching) detach_dev(div1);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t20);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Leaderboard', slots, []);

    	let leaderboard = [
    		{ name: "User 1", score: 100 },
    		{ name: "User 2", score: 90 },
    		{ name: "User 4", score: 80 },
    		{ name: "User 5", score: 80 },
    		{ name: "User 3", score: 80 },
    		{ name: "User 3", score: 80 },
    		{ name: "User 3", score: 80 },
    		{ name: "User 3", score: 80 },
    		{ name: "User 3", score: 80 },
    		{ name: "User 1", score: 100 },
    		{ name: "User 2", score: 90 },
    		{ name: "User 3", score: 80 },
    		{ name: "User 3", score: 80 },
    		{ name: "User 3", score: 80 },
    		{ name: "User 3", score: 80 },
    		{ name: "User 3", score: 80 },
    		{ name: "User 3", score: 80 },
    		{ name: "User 3", score: 80 },
    		{ name: "User 1", score: 100 },
    		{ name: "User 2", score: 90 },
    		{ name: "User 3", score: 80 },
    		{ name: "User 3", score: 80 },
    		{ name: "User 3", score: 80 },
    		{ name: "User 3", score: 80 },
    		{ name: "User 3", score: 80 },
    		{ name: "User 3", score: 80 },
    		{ name: "User 3", score: 80 },
    		{ name: "User 1", score: 100 },
    		{ name: "User 2", score: 90 },
    		{ name: "User 3", score: 80 },
    		{ name: "User 3", score: 80 },
    		{ name: "User 3", score: 80 },
    		{ name: "User 3", score: 80 },
    		{ name: "User 3", score: 80 },
    		{ name: "User 3", score: 80 }
    	]; // ... add more users as needed

    	let showAccountDropdown = false;

    	onMount(async () => {
    		const uid = getCookie("uid");

    		if (!uid) {
    			console.log("User is not logged in");

    			// redirect to dashboard
    			push("/");

    			return;
    		}

    		// fetch leaderboard
    		let response = await fetch("http://localhost:3000" + "/leaderboard", {
    			method: "GET",
    			headers: { "Content-Type": "application/json" }
    		});

    		let data = await response.json();
    		let resData = data.data;

    		// remove uid prop frm resData
    		delete resData.uid;

    		$$invalidate(0, leaderboard = resData);
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$2.warn(`<Leaderboard> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => $$invalidate(1, showAccountDropdown = !showAccountDropdown);

    	$$self.$capture_state = () => ({
    		fetch,
    		onMount,
    		getCookie,
    		push,
    		leaderboard,
    		showAccountDropdown
    	});

    	$$self.$inject_state = $$props => {
    		if ('leaderboard' in $$props) $$invalidate(0, leaderboard = $$props.leaderboard);
    		if ('showAccountDropdown' in $$props) $$invalidate(1, showAccountDropdown = $$props.showAccountDropdown);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [leaderboard, showAccountDropdown, click_handler];
    }

    class Leaderboard extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Leaderboard",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src/pages/AccountPage.svelte generated by Svelte v3.59.2 */

    const { console: console_1$1 } = globals;
    const file$1 = "src/pages/AccountPage.svelte";

    // (143:16) {:else}
    function create_else_block(ctx) {
    	let svg;
    	let path0;
    	let path1;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path0 = svg_element("path");
    			path1 = svg_element("path");
    			attr_dev(path0, "stroke-linecap", "round");
    			attr_dev(path0, "stroke-linejoin", "round");
    			attr_dev(path0, "stroke-width", "2");
    			attr_dev(path0, "d", "M15 12a3 3 0 11-6 0 3 3 0 016 0z");
    			add_location(path0, file$1, 149, 24, 5363);
    			attr_dev(path1, "stroke-linecap", "round");
    			attr_dev(path1, "stroke-linejoin", "round");
    			attr_dev(path1, "stroke-width", "2");
    			attr_dev(path1, "d", "M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z");
    			add_location(path1, file$1, 155, 24, 5633);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "stroke", "currentColor");
    			add_location(svg, file$1, 143, 20, 5127);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path0);
    			append_dev(svg, path1);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(143:16) {:else}",
    		ctx
    	});

    	return block;
    }

    // (129:16) {#if show}
    function create_if_block_1(ctx) {
    	let svg;
    	let path;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "stroke-linecap", "round");
    			attr_dev(path, "stroke-linejoin", "round");
    			attr_dev(path, "stroke-width", "2");
    			attr_dev(path, "d", "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21");
    			add_location(path, file$1, 135, 24, 4546);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "stroke", "red");
    			add_location(svg, file$1, 129, 20, 4319);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(129:16) {#if show}",
    		ctx
    	});

    	return block;
    }

    // (177:0) {#if showAccountDropdown}
    function create_if_block(ctx) {
    	let div;
    	let ul;
    	let li0;
    	let a0;
    	let t1;
    	let li1;
    	let a1;

    	const block = {
    		c: function create() {
    			div = element("div");
    			ul = element("ul");
    			li0 = element("li");
    			a0 = element("a");
    			a0.textContent = "Account";
    			t1 = space();
    			li1 = element("li");
    			a1 = element("a");
    			a1.textContent = "Logout";
    			attr_dev(a0, "href", "/#/account");
    			add_location(a0, file$1, 182, 16, 6536);
    			attr_dev(li0, "class", "py-2");
    			add_location(li0, file$1, 181, 12, 6502);
    			attr_dev(a1, "href", "/#/logout");
    			add_location(a1, file$1, 185, 16, 6633);
    			attr_dev(li1, "class", "py-2");
    			add_location(li1, file$1, 184, 12, 6599);
    			add_location(ul, file$1, 180, 8, 6485);
    			attr_dev(div, "class", "fixed top-0 right-0 mt-[7rem] mr-10 bg-white p-5 rounded-md shadow-lg");
    			add_location(div, file$1, 177, 4, 6380);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, ul);
    			append_dev(ul, li0);
    			append_dev(li0, a0);
    			append_dev(ul, t1);
    			append_dev(ul, li1);
    			append_dev(li1, a1);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(177:0) {#if showAccountDropdown}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let header;
    	let div0;
    	let a0;
    	let img0;
    	let img0_src_value;
    	let t0;
    	let nav;
    	let ul;
    	let li0;
    	let a1;
    	let t2;
    	let li1;
    	let t3;
    	let li2;
    	let a2;
    	let t5;
    	let li3;
    	let t6;
    	let li4;
    	let a3;
    	let t8;
    	let li5;
    	let t9;
    	let li6;
    	let button0;
    	let img1;
    	let img1_src_value;
    	let t10;
    	let p;
    	let t11;
    	let svg;
    	let path;
    	let t12;
    	let div7;
    	let div6;
    	let h2;
    	let t14;
    	let h30;
    	let t16;
    	let div1;
    	let textinput;
    	let updating_value;
    	let t17;
    	let br;
    	let t18;
    	let h31;
    	let t20;
    	let div2;
    	let passwordinput;
    	let updating_value_1;
    	let updating_show;
    	let t21;
    	let button1;
    	let t22;
    	let div5;
    	let div3;
    	let h32;
    	let t23;
    	let t24;
    	let t25;
    	let div4;
    	let h33;
    	let t26;
    	let t27;
    	let t28;
    	let if_block1_anchor;
    	let current;
    	let mounted;
    	let dispose;

    	function textinput_value_binding(value) {
    		/*textinput_value_binding*/ ctx[7](value);
    	}

    	let textinput_props = {
    		placeholder: "Username",
    		disabled: "true"
    	};

    	if (/*username*/ ctx[1] !== void 0) {
    		textinput_props.value = /*username*/ ctx[1];
    	}

    	textinput = new TextInput({ props: textinput_props, $$inline: true });
    	binding_callbacks.push(() => bind(textinput, 'value', textinput_value_binding));

    	function passwordinput_value_binding(value) {
    		/*passwordinput_value_binding*/ ctx[8](value);
    	}

    	function passwordinput_show_binding(value) {
    		/*passwordinput_show_binding*/ ctx[9](value);
    	}

    	let passwordinput_props = { disabled: "true" };

    	if (/*password*/ ctx[2] !== void 0) {
    		passwordinput_props.value = /*password*/ ctx[2];
    	}

    	if (/*show*/ ctx[5] !== void 0) {
    		passwordinput_props.show = /*show*/ ctx[5];
    	}

    	passwordinput = new PasswordInput({
    			props: passwordinput_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(passwordinput, 'value', passwordinput_value_binding));
    	binding_callbacks.push(() => bind(passwordinput, 'show', passwordinput_show_binding));

    	function select_block_type(ctx, dirty) {
    		if (/*show*/ ctx[5]) return create_if_block_1;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type(ctx);
    	let if_block1 = /*showAccountDropdown*/ ctx[0] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			header = element("header");
    			div0 = element("div");
    			a0 = element("a");
    			img0 = element("img");
    			t0 = space();
    			nav = element("nav");
    			ul = element("ul");
    			li0 = element("li");
    			a1 = element("a");
    			a1.textContent = "Home";
    			t2 = space();
    			li1 = element("li");
    			t3 = space();
    			li2 = element("li");
    			a2 = element("a");
    			a2.textContent = "Leaderboard";
    			t5 = space();
    			li3 = element("li");
    			t6 = space();
    			li4 = element("li");
    			a3 = element("a");
    			a3.textContent = "About";
    			t8 = space();
    			li5 = element("li");
    			t9 = space();
    			li6 = element("li");
    			button0 = element("button");
    			img1 = element("img");
    			t10 = space();
    			p = element("p");
    			t11 = space();
    			svg = svg_element("svg");
    			path = svg_element("path");
    			t12 = space();
    			div7 = element("div");
    			div6 = element("div");
    			h2 = element("h2");
    			h2.textContent = "Account";
    			t14 = space();
    			h30 = element("h3");
    			h30.textContent = "Username:";
    			t16 = space();
    			div1 = element("div");
    			create_component(textinput.$$.fragment);
    			t17 = space();
    			br = element("br");
    			t18 = space();
    			h31 = element("h3");
    			h31.textContent = "Password:";
    			t20 = space();
    			div2 = element("div");
    			create_component(passwordinput.$$.fragment);
    			t21 = space();
    			button1 = element("button");
    			if_block0.c();
    			t22 = space();
    			div5 = element("div");
    			div3 = element("div");
    			h32 = element("h3");
    			t23 = text("Score: ");
    			t24 = text(/*score*/ ctx[3]);
    			t25 = space();
    			div4 = element("div");
    			h33 = element("h3");
    			t26 = text("Games Played: ");
    			t27 = text(/*gamesPlayed*/ ctx[4]);
    			t28 = space();
    			if (if_block1) if_block1.c();
    			if_block1_anchor = empty();
    			if (!src_url_equal(img0.src, img0_src_value = "./assets/logo_expanded.svg")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "logo");
    			attr_dev(img0, "class", "w-60");
    			add_location(img0, file$1, 52, 12, 1577);
    			attr_dev(a0, "href", "/");
    			add_location(a0, file$1, 51, 8, 1552);
    			attr_dev(div0, "class", "flex");
    			add_location(div0, file$1, 50, 4, 1525);
    			attr_dev(a1, "href", "/");
    			add_location(a1, file$1, 57, 34, 1749);
    			attr_dev(li0, "class", "font-bold");
    			add_location(li0, file$1, 57, 12, 1727);
    			attr_dev(li1, "class", "px-2");
    			add_location(li1, file$1, 58, 12, 1787);
    			attr_dev(a2, "href", "/#/leaderboard");
    			add_location(a2, file$1, 59, 34, 1844);
    			attr_dev(li2, "class", "font-bold");
    			add_location(li2, file$1, 59, 12, 1822);
    			attr_dev(li3, "class", "px-2");
    			add_location(li3, file$1, 60, 12, 1902);
    			attr_dev(a3, "href", "/about");
    			add_location(a3, file$1, 61, 34, 1959);
    			attr_dev(li4, "class", "font-bold");
    			add_location(li4, file$1, 61, 12, 1937);
    			attr_dev(li5, "class", "px-2");
    			add_location(li5, file$1, 62, 12, 2003);
    			if (!src_url_equal(img1.src, img1_src_value = "../../assets/account.png")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "user");
    			attr_dev(img1, "class", "w-10");
    			add_location(img1, file$1, 69, 20, 2275);
    			attr_dev(p, "class", "px-1");
    			add_location(p, file$1, 74, 20, 2450);
    			attr_dev(path, "stroke-linecap", "round");
    			attr_dev(path, "stroke-linejoin", "round");
    			attr_dev(path, "d", "m19.5 8.25-7.5 7.5-7.5-7.5");
    			add_location(path, file$1, 83, 24, 2810);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "stroke-width", "1.5");
    			attr_dev(svg, "stroke", "currentColor");
    			attr_dev(svg, "class", "w-6 h-6");
    			add_location(svg, file$1, 75, 20, 2491);
    			attr_dev(button0, "class", "flex items-center");
    			add_location(button0, file$1, 64, 16, 2077);
    			attr_dev(li6, "class", "font-bold");
    			add_location(li6, file$1, 63, 12, 2038);
    			attr_dev(ul, "class", "flex items-center");
    			add_location(ul, file$1, 56, 8, 1684);
    			add_location(nav, file$1, 55, 4, 1670);
    			attr_dev(header, "class", "flex justify-between p-10 items-center");
    			add_location(header, file$1, 48, 0, 1449);
    			attr_dev(h2, "class", "text-6xl mb-10 text-center");
    			add_location(h2, file$1, 102, 8, 3379);
    			attr_dev(h30, "class", "text-3xl");
    			add_location(h30, file$1, 105, 8, 3479);
    			attr_dev(div1, "class", "flex flex-col items-center gap-5");
    			add_location(div1, file$1, 107, 8, 3524);
    			add_location(br, file$1, 116, 8, 3830);
    			attr_dev(h31, "class", "text-3xl");
    			add_location(h31, file$1, 118, 8, 3846);
    			attr_dev(button1, "class", "h-10 w-10 absolute inset-y-0 right-0 pr-3");
    			add_location(button1, file$1, 122, 12, 4082);
    			attr_dev(div2, "class", "relative");
    			add_location(div2, file$1, 120, 8, 3969);
    			attr_dev(h32, "class", "text-3xl");
    			add_location(h32, file$1, 167, 16, 6149);
    			attr_dev(div3, "class", "pr-40");
    			add_location(div3, file$1, 166, 12, 6113);
    			attr_dev(h33, "class", "text-3xl");
    			add_location(h33, file$1, 170, 16, 6243);
    			add_location(div4, file$1, 169, 12, 6221);
    			attr_dev(div5, "class", "flex justify-between mt-10");
    			add_location(div5, file$1, 165, 8, 6060);
    			attr_dev(div6, "class", "p-40 pt-20 pb-20 bg-white rounded-2xl shadow-lg justify-center items-center");
    			add_location(div6, file$1, 98, 4, 3210);
    			attr_dev(div7, "class", "flex flex-col items-center justify-center bg-gray-100 p-10 overflow-hidden");
    			add_location(div7, file$1, 95, 0, 3112);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, header, anchor);
    			append_dev(header, div0);
    			append_dev(div0, a0);
    			append_dev(a0, img0);
    			append_dev(header, t0);
    			append_dev(header, nav);
    			append_dev(nav, ul);
    			append_dev(ul, li0);
    			append_dev(li0, a1);
    			append_dev(ul, t2);
    			append_dev(ul, li1);
    			append_dev(ul, t3);
    			append_dev(ul, li2);
    			append_dev(li2, a2);
    			append_dev(ul, t5);
    			append_dev(ul, li3);
    			append_dev(ul, t6);
    			append_dev(ul, li4);
    			append_dev(li4, a3);
    			append_dev(ul, t8);
    			append_dev(ul, li5);
    			append_dev(ul, t9);
    			append_dev(ul, li6);
    			append_dev(li6, button0);
    			append_dev(button0, img1);
    			append_dev(button0, t10);
    			append_dev(button0, p);
    			append_dev(button0, t11);
    			append_dev(button0, svg);
    			append_dev(svg, path);
    			insert_dev(target, t12, anchor);
    			insert_dev(target, div7, anchor);
    			append_dev(div7, div6);
    			append_dev(div6, h2);
    			append_dev(div6, t14);
    			append_dev(div6, h30);
    			append_dev(div6, t16);
    			append_dev(div6, div1);
    			mount_component(textinput, div1, null);
    			append_dev(div6, t17);
    			append_dev(div6, br);
    			append_dev(div6, t18);
    			append_dev(div6, h31);
    			append_dev(div6, t20);
    			append_dev(div6, div2);
    			mount_component(passwordinput, div2, null);
    			append_dev(div2, t21);
    			append_dev(div2, button1);
    			if_block0.m(button1, null);
    			append_dev(div6, t22);
    			append_dev(div6, div5);
    			append_dev(div5, div3);
    			append_dev(div3, h32);
    			append_dev(h32, t23);
    			append_dev(h32, t24);
    			append_dev(div5, t25);
    			append_dev(div5, div4);
    			append_dev(div4, h33);
    			append_dev(h33, t26);
    			append_dev(h33, t27);
    			insert_dev(target, t28, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert_dev(target, if_block1_anchor, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler*/ ctx[6], false, false, false, false),
    					listen_dev(button1, "click", prevent_default(/*click_handler_1*/ ctx[10]), false, true, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			const textinput_changes = {};

    			if (!updating_value && dirty & /*username*/ 2) {
    				updating_value = true;
    				textinput_changes.value = /*username*/ ctx[1];
    				add_flush_callback(() => updating_value = false);
    			}

    			textinput.$set(textinput_changes);
    			const passwordinput_changes = {};

    			if (!updating_value_1 && dirty & /*password*/ 4) {
    				updating_value_1 = true;
    				passwordinput_changes.value = /*password*/ ctx[2];
    				add_flush_callback(() => updating_value_1 = false);
    			}

    			if (!updating_show && dirty & /*show*/ 32) {
    				updating_show = true;
    				passwordinput_changes.show = /*show*/ ctx[5];
    				add_flush_callback(() => updating_show = false);
    			}

    			passwordinput.$set(passwordinput_changes);

    			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(button1, null);
    				}
    			}

    			if (!current || dirty & /*score*/ 8) set_data_dev(t24, /*score*/ ctx[3]);
    			if (!current || dirty & /*gamesPlayed*/ 16) set_data_dev(t27, /*gamesPlayed*/ ctx[4]);

    			if (/*showAccountDropdown*/ ctx[0]) {
    				if (if_block1) ; else {
    					if_block1 = create_if_block(ctx);
    					if_block1.c();
    					if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(textinput.$$.fragment, local);
    			transition_in(passwordinput.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(textinput.$$.fragment, local);
    			transition_out(passwordinput.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(header);
    			if (detaching) detach_dev(t12);
    			if (detaching) detach_dev(div7);
    			destroy_component(textinput);
    			destroy_component(passwordinput);
    			if_block0.d();
    			if (detaching) detach_dev(t28);
    			if (if_block1) if_block1.d(detaching);
    			if (detaching) detach_dev(if_block1_anchor);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('AccountPage', slots, []);
    	let showAccountDropdown = false;
    	let username = "user123";
    	let password = "password123";
    	let score = 100;
    	let gamesPlayed = 10;
    	let show = false;

    	onMount(() => {
    		const uid = getCookie$1("uid");

    		if (!uid) {
    			console.log("User is not logged in");

    			// redirect to dashboard
    			push("/");
    		}

    		// fetch user data
    		fetch("http://localhost:3000" + "/user/" + uid, {
    			method: "GET",
    			headers: { "Content-Type": "application/json" }
    		}).then(res => res.json()).then(a => a.data).then(data => {
    			$$invalidate(1, username = data.name);
    			$$invalidate(2, password = data.password);
    			$$invalidate(3, score = data.score);
    			$$invalidate(4, gamesPlayed = data["games-played"]);
    		}).catch(err => {
    			console.error(err);
    		});
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$1.warn(`<AccountPage> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => $$invalidate(0, showAccountDropdown = !showAccountDropdown);

    	function textinput_value_binding(value) {
    		username = value;
    		$$invalidate(1, username);
    	}

    	function passwordinput_value_binding(value) {
    		password = value;
    		$$invalidate(2, password);
    	}

    	function passwordinput_show_binding(value) {
    		show = value;
    		$$invalidate(5, show);
    	}

    	const click_handler_1 = () => {
    		$$invalidate(5, show = !show);
    	};

    	$$self.$capture_state = () => ({
    		fetch,
    		getCookie: getCookie$1,
    		onMount,
    		push,
    		TextInput,
    		PasswordInput,
    		showAccountDropdown,
    		username,
    		password,
    		score,
    		gamesPlayed,
    		show
    	});

    	$$self.$inject_state = $$props => {
    		if ('showAccountDropdown' in $$props) $$invalidate(0, showAccountDropdown = $$props.showAccountDropdown);
    		if ('username' in $$props) $$invalidate(1, username = $$props.username);
    		if ('password' in $$props) $$invalidate(2, password = $$props.password);
    		if ('score' in $$props) $$invalidate(3, score = $$props.score);
    		if ('gamesPlayed' in $$props) $$invalidate(4, gamesPlayed = $$props.gamesPlayed);
    		if ('show' in $$props) $$invalidate(5, show = $$props.show);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		showAccountDropdown,
    		username,
    		password,
    		score,
    		gamesPlayed,
    		show,
    		click_handler,
    		textinput_value_binding,
    		passwordinput_value_binding,
    		passwordinput_show_binding,
    		click_handler_1
    	];
    }

    class AccountPage extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AccountPage",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src/pages/LogoutPage.svelte generated by Svelte v3.59.2 */

    const { console: console_1 } = globals;
    const file = "src/pages/LogoutPage.svelte";

    function create_fragment$1(ctx) {
    	let div;
    	let img;
    	let img_src_value;
    	let t0;
    	let h1;

    	const block = {
    		c: function create() {
    			div = element("div");
    			img = element("img");
    			t0 = space();
    			h1 = element("h1");
    			h1.textContent = "BrainSpark";
    			if (!src_url_equal(img.src, img_src_value = "./assets/logo.svg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "logo");
    			attr_dev(img, "class", "w-20");
    			add_location(img, file, 17, 4, 424);
    			attr_dev(h1, "class", "text-3xl font-bold ml-3");
    			add_location(h1, file, 18, 4, 484);
    			attr_dev(div, "class", "flex");
    			add_location(div, file, 16, 0, 401);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, img);
    			append_dev(div, t0);
    			append_dev(div, h1);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('LogoutPage', slots, []);

    	onMount(() => {
    		const uid = getCookie("uid");

    		if (!uid) {
    			console.log("User is not logged in");
    		} else {
    			deleteCookie("uid");
    		}

    		push("/");
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<LogoutPage> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ onMount, deleteCookie, getCookie, push });
    	return [];
    }

    class LogoutPage extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "LogoutPage",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.59.2 */

    function create_fragment(ctx) {
    	let router;
    	let current;

    	router = new Router({
    			props: { routes: /*routes*/ ctx[0] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(router.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(router, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(router.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(router.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(router, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);

    	const routes = {
    		"/": LandingPage,
    		"/home": HomePage,
    		"/play": PlayPage,
    		"/leaderboard": Leaderboard,
    		"/account": AccountPage,
    		"/logout": LogoutPage
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		Router,
    		LandingPage,
    		HomePage,
    		PlayPage,
    		Leaderboard,
    		AccountPage,
    		Logout: LogoutPage,
    		routes
    	});

    	return [routes];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
        target: document.body,
        props: {
            name: "world",
        },
    });

    return app;

})(fetch);
//# sourceMappingURL=bundle.js.map
