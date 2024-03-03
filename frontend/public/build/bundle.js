
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
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

    const { Error: Error_1, Object: Object_1, console: console_1 } = globals;

    // (246:0) {:else}
    function create_else_block$1(ctx) {
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
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(246:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (239:0) {#if componentParams}
    function create_if_block$3(ctx) {
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
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(239:0) {#if componentParams}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$9(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$3, create_else_block$1];
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
    		id: create_fragment$9.name,
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

    function instance$9($$self, $$props, $$invalidate) {
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
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<Router> was created with unknown prop '${key}'`);
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

    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {
    			routes: 3,
    			prefix: 4,
    			restoreScrollState: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Router",
    			options,
    			id: create_fragment$9.name
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

    const file$7 = "src/components/Button.svelte";

    function create_fragment$8(ctx) {
    	let button;
    	let t;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			t = text(/*label*/ ctx[0]);
    			attr_dev(button, "class", "bg-gradient-to-br from-[#5c4f9e] to-[#342d59] text-white py-2 px-3 rounded-md");
    			add_location(button, file$7, 4, 0, 53);
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
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, { label: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Button",
    			options,
    			id: create_fragment$8.name
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

    const file$6 = "src/components/TextInput.svelte";

    function create_fragment$7(ctx) {
    	let input;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			input = element("input");
    			attr_dev(input, "class", "appearance-none border-2 border-gray-300 rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline");
    			attr_dev(input, "placeholder", /*placeholder*/ ctx[0]);
    			attr_dev(input, "type", "text");
    			add_location(input, file$6, 5, 0, 68);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    			set_input_value(input, /*value*/ ctx[1]);

    			if (!mounted) {
    				dispose = listen_dev(input, "input", /*input_input_handler*/ ctx[2]);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*placeholder*/ 1) {
    				attr_dev(input, "placeholder", /*placeholder*/ ctx[0]);
    			}

    			if (dirty & /*value*/ 2 && input.value !== /*value*/ ctx[1]) {
    				set_input_value(input, /*value*/ ctx[1]);
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
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('TextInput', slots, []);
    	let value = "";
    	let { placeholder } = $$props;

    	$$self.$$.on_mount.push(function () {
    		if (placeholder === undefined && !('placeholder' in $$props || $$self.$$.bound[$$self.$$.props['placeholder']])) {
    			console.warn("<TextInput> was created without expected prop 'placeholder'");
    		}
    	});

    	const writable_props = ['placeholder'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<TextInput> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		value = this.value;
    		$$invalidate(1, value);
    	}

    	$$self.$$set = $$props => {
    		if ('placeholder' in $$props) $$invalidate(0, placeholder = $$props.placeholder);
    	};

    	$$self.$capture_state = () => ({ value, placeholder });

    	$$self.$inject_state = $$props => {
    		if ('value' in $$props) $$invalidate(1, value = $$props.value);
    		if ('placeholder' in $$props) $$invalidate(0, placeholder = $$props.placeholder);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [placeholder, value, input_input_handler];
    }

    class TextInput extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, { placeholder: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TextInput",
    			options,
    			id: create_fragment$7.name
    		});
    	}

    	get placeholder() {
    		throw new Error("<TextInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set placeholder(value) {
    		throw new Error("<TextInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/PasswordInput.svelte generated by Svelte v3.59.2 */

    const file$5 = "src/components/PasswordInput.svelte";

    function create_fragment$6(ctx) {
    	let input;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			input = element("input");
    			attr_dev(input, "class", "appearance-none border-2 border-gray-300 rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline");
    			attr_dev(input, "placeholder", "Password");
    			attr_dev(input, "type", "password");
    			add_location(input, file$5, 4, 0, 40);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    			set_input_value(input, /*value*/ ctx[0]);

    			if (!mounted) {
    				dispose = listen_dev(input, "input", /*input_input_handler*/ ctx[1]);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
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
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('PasswordInput', slots, []);
    	let value = "";
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<PasswordInput> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		value = this.value;
    		$$invalidate(0, value);
    	}

    	$$self.$capture_state = () => ({ value });

    	$$self.$inject_state = $$props => {
    		if ('value' in $$props) $$invalidate(0, value = $$props.value);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [value, input_input_handler];
    }

    class PasswordInput extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "PasswordInput",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src/pages/LandingPage.svelte generated by Svelte v3.59.2 */
    const file$4 = "src/pages/LandingPage.svelte";

    // (123:21) 
    function create_if_block_1$2(ctx) {
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
    	let t7;
    	let p3;
    	let t8;
    	let passwordinput;
    	let t9;
    	let p4;
    	let t10;
    	let button1;
    	let t11;
    	let p5;
    	let t12;
    	let div1;
    	let t13;
    	let t14_value = " " + "";
    	let t14;
    	let t15;
    	let p6;
    	let t16;
    	let button2;
    	let current;
    	let mounted;
    	let dispose;

    	textinput = new TextInput({
    			props: { placeholder: "Username" },
    			$$inline: true
    		});

    	passwordinput = new PasswordInput({ $$inline: true });

    	button1 = new Button({
    			props: { label: "Login" },
    			$$inline: true
    		});

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
    			t3 = text("Close\n                    \n                    ");
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
    			p5 = element("p");
    			t12 = space();
    			div1 = element("div");
    			t13 = text("Need an account?");
    			t14 = text(t14_value);
    			t15 = space();
    			p6 = element("p");
    			t16 = space();
    			button2 = element("button");
    			button2.textContent = "Sign Up";
    			attr_dev(h2, "class", "text-3xl font-bold font-vag");
    			add_location(h2, file$4, 128, 16, 4460);
    			attr_dev(p0, "class", "px-10");
    			add_location(p0, file$4, 131, 16, 4579);
    			attr_dev(p1, "class", "px-1");
    			add_location(p1, file$4, 140, 20, 4870);
    			attr_dev(path, "stroke-linecap", "round");
    			attr_dev(path, "stroke-linejoin", "round");
    			attr_dev(path, "d", "M6 18 18 6M6 6l12 12");
    			add_location(path, file$4, 149, 24, 5230);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "stroke-width", "1.5");
    			attr_dev(svg, "stroke", "currentColor");
    			attr_dev(svg, "class", "w-6 h-6");
    			add_location(svg, file$4, 141, 20, 4911);
    			attr_dev(button0, "class", "ml-auto flex");
    			add_location(button0, file$4, 132, 16, 4617);
    			attr_dev(div0, "class", "flex items-center justify-center");
    			add_location(div0, file$4, 127, 12, 4397);
    			attr_dev(p2, "class", "py-3");
    			add_location(p2, file$4, 157, 12, 5503);
    			attr_dev(p3, "class", "py-3");
    			add_location(p3, file$4, 159, 12, 5585);
    			attr_dev(p4, "class", "py-3");
    			add_location(p4, file$4, 161, 12, 5648);
    			attr_dev(p5, "class", "py-3");
    			add_location(p5, file$4, 164, 12, 5761);
    			attr_dev(p6, "class", "px-1");
    			add_location(p6, file$4, 167, 16, 5867);
    			attr_dev(button2, "class", "text-blue-500");
    			add_location(button2, file$4, 168, 16, 5904);
    			attr_dev(div1, "class", "flex");
    			add_location(div1, file$4, 165, 12, 5794);
    			attr_dev(div2, "class", "bg-white p-10 rounded-md");
    			add_location(div2, file$4, 126, 8, 4346);
    			attr_dev(div3, "class", "fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex justify-center items-center");
    			add_location(div3, file$4, 123, 4, 4222);
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
    			append_dev(div2, p5);
    			append_dev(div2, t12);
    			append_dev(div2, div1);
    			append_dev(div1, t13);
    			append_dev(div1, t14);
    			append_dev(div1, t15);
    			append_dev(div1, p6);
    			append_dev(div1, t16);
    			append_dev(div1, button2);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler_3*/ ctx[5], false, false, false, false),
    					listen_dev(button2, "click", /*click_handler_4*/ ctx[6], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
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
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(123:21) ",
    		ctx
    	});

    	return block;
    }

    // (63:0) {#if signupModal}
    function create_if_block$2(ctx) {
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
    	let t9;
    	let p4;
    	let t10;
    	let passwordinput;
    	let t11;
    	let p5;
    	let t12;
    	let button1;
    	let t13;
    	let p6;
    	let t14;
    	let div1;
    	let t15;
    	let t16_value = " " + "";
    	let t16;
    	let t17;
    	let p7;
    	let t18;
    	let button2;
    	let current;
    	let mounted;
    	let dispose;

    	textinput = new TextInput({
    			props: { placeholder: "Username" },
    			$$inline: true
    		});

    	passwordinput = new PasswordInput({ $$inline: true });

    	button1 = new Button({
    			props: { label: "Sign Up" },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			h2 = element("h2");
    			h2.textContent = "Welcome to BrainSpark";
    			t1 = space();
    			button0 = element("button");
    			t2 = text("Close\n                    \n                    ");
    			p0 = element("p");
    			t3 = space();
    			svg = svg_element("svg");
    			path = svg_element("path");
    			t4 = space();
    			p1 = element("p");
    			t5 = space();
    			p2 = element("p");
    			p2.textContent = "BrainSpark is a platform that helps students learn via games,\n                powerups, and customized learning.";
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
    			p6 = element("p");
    			t14 = space();
    			div1 = element("div");
    			t15 = text("Already have an account?");
    			t16 = text(t16_value);
    			t17 = space();
    			p7 = element("p");
    			t18 = space();
    			button2 = element("button");
    			button2.textContent = "Log in";
    			attr_dev(h2, "class", "text-3xl font-bold font-vag");
    			add_location(h2, file$4, 68, 16, 2305);
    			attr_dev(p0, "class", "px-1");
    			add_location(p0, file$4, 79, 20, 2680);
    			attr_dev(path, "stroke-linecap", "round");
    			attr_dev(path, "stroke-linejoin", "round");
    			attr_dev(path, "d", "M6 18 18 6M6 6l12 12");
    			add_location(path, file$4, 88, 24, 3040);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "stroke-width", "1.5");
    			attr_dev(svg, "stroke", "currentColor");
    			attr_dev(svg, "class", "w-6 h-6");
    			add_location(svg, file$4, 80, 20, 2721);
    			attr_dev(button0, "class", "ml-auto flex");
    			add_location(button0, file$4, 71, 16, 2426);
    			attr_dev(div0, "class", "flex");
    			add_location(div0, file$4, 67, 12, 2270);
    			attr_dev(p1, "class", "py-3");
    			add_location(p1, file$4, 96, 12, 3313);
    			add_location(p2, file$4, 97, 12, 3346);
    			attr_dev(p3, "class", "py-3");
    			add_location(p3, file$4, 101, 12, 3508);
    			attr_dev(p4, "class", "py-3");
    			add_location(p4, file$4, 103, 12, 3590);
    			attr_dev(p5, "class", "py-3");
    			add_location(p5, file$4, 105, 12, 3653);
    			attr_dev(p6, "class", "py-3");
    			add_location(p6, file$4, 108, 12, 3768);
    			attr_dev(p7, "class", "px-1");
    			add_location(p7, file$4, 111, 16, 3882);
    			attr_dev(button2, "class", "text-blue-500");
    			add_location(button2, file$4, 112, 16, 3919);
    			attr_dev(div1, "class", "flex");
    			add_location(div1, file$4, 109, 12, 3801);
    			attr_dev(div2, "class", "bg-white p-10 rounded-md");
    			add_location(div2, file$4, 66, 8, 2219);
    			attr_dev(div3, "class", "fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex justify-center items-center");
    			add_location(div3, file$4, 63, 4, 2095);
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
    			append_dev(div2, p6);
    			append_dev(div2, t14);
    			append_dev(div2, div1);
    			append_dev(div1, t15);
    			append_dev(div1, t16);
    			append_dev(div1, t17);
    			append_dev(div1, p7);
    			append_dev(div1, t18);
    			append_dev(div1, button2);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler_1*/ ctx[3], false, false, false, false),
    					listen_dev(button2, "click", /*click_handler_2*/ ctx[4], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
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
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(63:0) {#if signupModal}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
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
    	let t15;
    	let div2;
    	let img1;
    	let img1_src_value;
    	let t16;
    	let current_block_type_index;
    	let if_block;
    	let t17;
    	let footer;
    	let div7;
    	let div5;
    	let p3;
    	let t19;
    	let p4;
    	let t21;
    	let div6;
    	let p5;
    	let current;
    	let mounted;
    	let dispose;

    	button1 = new Button({
    			props: { label: "Get Started" },
    			$$inline: true
    		});

    	const if_block_creators = [create_if_block$2, create_if_block_1$2];
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
    			button0.textContent = "Sign-Up";
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
    			p1.textContent = "The one-stop study tool to unleash your potential, BrainSpark\n                transforms learning into an exhilarating journey, where each\n                quiz invites you into a world of discovery, guided by custom\n                questions and powerups to ignite your curiosity.";
    			t13 = space();
    			p2 = element("p");
    			t14 = space();
    			create_component(button1.$$.fragment);
    			t15 = space();
    			div2 = element("div");
    			img1 = element("img");
    			t16 = space();
    			if (if_block) if_block.c();
    			t17 = space();
    			footer = element("footer");
    			div7 = element("div");
    			div5 = element("div");
    			p3 = element("p");
    			p3.textContent = "BrainSpark";
    			t19 = space();
    			p4 = element("p");
    			p4.textContent = "© 2024 BrainSpark";
    			t21 = space();
    			div6 = element("div");
    			p5 = element("p");
    			p5.textContent = "Contact";
    			if (!src_url_equal(img0.src, img0_src_value = "./assets/logo_expanded.svg")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "logo");
    			attr_dev(img0, "class", "w-60");
    			add_location(img0, file$4, 13, 12, 402);
    			attr_dev(a0, "href", "/");
    			add_location(a0, file$4, 12, 8, 377);
    			attr_dev(div0, "class", "flex");
    			add_location(div0, file$4, 11, 4, 350);
    			attr_dev(a1, "href", "/");
    			add_location(a1, file$4, 18, 34, 561);
    			attr_dev(li0, "class", "font-bold");
    			add_location(li0, file$4, 18, 12, 539);
    			attr_dev(li1, "class", "px-2");
    			add_location(li1, file$4, 21, 12, 699);
    			attr_dev(a2, "href", "/about");
    			add_location(a2, file$4, 22, 34, 756);
    			attr_dev(li2, "class", "font-bold");
    			add_location(li2, file$4, 22, 12, 734);
    			attr_dev(li3, "class", "px-2");
    			add_location(li3, file$4, 23, 12, 800);
    			add_location(button0, file$4, 25, 16, 874);
    			attr_dev(li4, "class", "font-bold");
    			add_location(li4, file$4, 24, 12, 835);
    			attr_dev(ul, "class", "flex");
    			add_location(ul, file$4, 17, 8, 509);
    			add_location(nav, file$4, 16, 4, 495);
    			attr_dev(header, "class", "flex justify-between p-10 items-center");
    			add_location(header, file$4, 9, 0, 274);
    			attr_dev(h1, "class", "text-7xl font-vag font-bold");
    			add_location(h1, file$4, 39, 12, 1305);
    			attr_dev(p0, "class", "py-3");
    			add_location(p0, file$4, 41, 12, 1408);
    			add_location(p1, file$4, 42, 12, 1441);
    			attr_dev(p2, "class", "py-3");
    			add_location(p2, file$4, 48, 12, 1771);
    			attr_dev(div1, "class", "w-1/2");
    			add_location(div1, file$4, 38, 8, 1273);
    			attr_dev(img1, "class", "rounded-2xl");
    			if (!src_url_equal(img1.src, img1_src_value = "./assets/placeholder.jpg")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "hero");
    			add_location(img1, file$4, 52, 12, 1890);
    			attr_dev(div2, "class", "w-1/2");
    			add_location(div2, file$4, 51, 8, 1858);
    			attr_dev(div3, "class", "flex");
    			add_location(div3, file$4, 37, 4, 1246);
    			attr_dev(div4, "class", "p-10 flex flex-col");
    			add_location(div4, file$4, 35, 0, 1075);
    			attr_dev(p3, "class", "font-bold");
    			add_location(p3, file$4, 183, 12, 6288);
    			add_location(p4, file$4, 184, 12, 6336);
    			add_location(div5, file$4, 182, 8, 6270);
    			attr_dev(p5, "class", "font-bold");
    			add_location(p5, file$4, 187, 12, 6402);
    			add_location(div6, file$4, 186, 8, 6384);
    			attr_dev(div7, "class", "flex justify-between");
    			add_location(div7, file$4, 181, 4, 6227);
    			attr_dev(footer, "class", "p-10 bg-gray-100");
    			add_location(footer, file$4, 180, 0, 6189);
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
    			append_dev(li4, button0);
    			insert_dev(target, t8, anchor);
    			insert_dev(target, div4, anchor);
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
    			mount_component(button1, div1, null);
    			append_dev(div3, t15);
    			append_dev(div3, div2);
    			append_dev(div2, img1);
    			insert_dev(target, t16, anchor);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(target, anchor);
    			}

    			insert_dev(target, t17, anchor);
    			insert_dev(target, footer, anchor);
    			append_dev(footer, div7);
    			append_dev(div7, div5);
    			append_dev(div5, p3);
    			append_dev(div5, t19);
    			append_dev(div5, p4);
    			append_dev(div7, t21);
    			append_dev(div7, div6);
    			append_dev(div6, p5);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button0, "click", /*click_handler*/ ctx[2], false, false, false, false);
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
    					if_block.m(t17.parentNode, t17);
    				} else {
    					if_block = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button1.$$.fragment, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button1.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(header);
    			if (detaching) detach_dev(t8);
    			if (detaching) detach_dev(div4);
    			destroy_component(button1);
    			if (detaching) detach_dev(t16);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d(detaching);
    			}

    			if (detaching) detach_dev(t17);
    			if (detaching) detach_dev(footer);
    			mounted = false;
    			dispose();
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
    	validate_slots('LandingPage', slots, []);
    	let { signupModal = false } = $$props;
    	let { loginModal = false } = $$props;
    	const writable_props = ['signupModal', 'loginModal'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<LandingPage> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => {
    		$$invalidate(0, signupModal = true);
    	};

    	const click_handler_1 = () => {
    		$$invalidate(0, signupModal = false);
    	};

    	const click_handler_2 = () => {
    		$$invalidate(1, loginModal = true);
    		$$invalidate(0, signupModal = false);
    	};

    	const click_handler_3 = () => {
    		$$invalidate(1, loginModal = false);
    	};

    	const click_handler_4 = () => {
    		$$invalidate(1, loginModal = false);
    		$$invalidate(0, signupModal = true);
    	};

    	$$self.$$set = $$props => {
    		if ('signupModal' in $$props) $$invalidate(0, signupModal = $$props.signupModal);
    		if ('loginModal' in $$props) $$invalidate(1, loginModal = $$props.loginModal);
    	};

    	$$self.$capture_state = () => ({
    		Button,
    		TextInput,
    		PasswordInput,
    		signupModal,
    		loginModal
    	});

    	$$self.$inject_state = $$props => {
    		if ('signupModal' in $$props) $$invalidate(0, signupModal = $$props.signupModal);
    		if ('loginModal' in $$props) $$invalidate(1, loginModal = $$props.loginModal);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		signupModal,
    		loginModal,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4
    	];
    }

    class LandingPage extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { signupModal: 0, loginModal: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "LandingPage",
    			options,
    			id: create_fragment$5.name
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
    }

    /* src/components/AltButton.svelte generated by Svelte v3.59.2 */

    const file$3 = "src/components/AltButton.svelte";

    function create_fragment$4(ctx) {
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
    			add_location(button, file$3, 6, 0, 122);
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
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { label: 0, color: 1, textColor: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AltButton",
    			options,
    			id: create_fragment$4.name
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

    /* src/pages/HomePage.svelte generated by Svelte v3.59.2 */
    const file$2 = "src/pages/HomePage.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[14] = list[i];
    	child_ctx[16] = i;
    	return child_ctx;
    }

    // (113:0) {#if createGameModal}
    function create_if_block$1(ctx) {
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
    	let textinput;
    	let t7;
    	let p3;
    	let t8;
    	let p4;
    	let t9;
    	let t10;
    	let t11;
    	let input;
    	let t12;
    	let p5;
    	let t13;
    	let p6;
    	let t15;
    	let div2;
    	let div1;
    	let button1;
    	let t16;
    	let button1_class_value;
    	let t17;
    	let button2;
    	let t18;
    	let button2_class_value;
    	let t19;
    	let button3;
    	let t20;
    	let button3_class_value;
    	let t21;
    	let button4;
    	let t22;
    	let button4_class_value;
    	let t23;
    	let button5;
    	let t24;
    	let button5_class_value;
    	let t25;
    	let p7;
    	let t26;
    	let t27;
    	let p8;
    	let t28;
    	let button6;
    	let current;
    	let mounted;
    	let dispose;

    	textinput = new TextInput({
    			props: { placeholder: "Game Name" },
    			$$inline: true
    		});

    	let if_block = /*availableSubTopics*/ ctx[4].length != 0 && create_if_block_1$1(ctx);

    	button6 = new Button({
    			props: { label: "Create" },
    			$$inline: true
    		});

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
    			t3 = text("Close\n                    \n                    ");
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
    			p4 = element("p");
    			t9 = text("Number of questions: ");
    			t10 = text(/*numQuestions*/ ctx[2]);
    			t11 = space();
    			input = element("input");
    			t12 = space();
    			p5 = element("p");
    			t13 = space();
    			p6 = element("p");
    			p6.textContent = "Select your subject:";
    			t15 = space();
    			div2 = element("div");
    			div1 = element("div");
    			button1 = element("button");
    			t16 = text("Math");
    			t17 = space();
    			button2 = element("button");
    			t18 = text("Science");
    			t19 = space();
    			button3 = element("button");
    			t20 = text("English");
    			t21 = space();
    			button4 = element("button");
    			t22 = text("History");
    			t23 = space();
    			button5 = element("button");
    			t24 = text("Miscellaneous");
    			t25 = space();
    			p7 = element("p");
    			t26 = space();
    			if (if_block) if_block.c();
    			t27 = space();
    			p8 = element("p");
    			t28 = space();
    			create_component(button6.$$.fragment);
    			attr_dev(h2, "class", "text-3xl font-bold font-vag");
    			add_location(h2, file$2, 118, 16, 4458);
    			attr_dev(p0, "class", "px-10");
    			add_location(p0, file$2, 119, 16, 4533);
    			attr_dev(p1, "class", "px-1");
    			add_location(p1, file$2, 128, 20, 4829);
    			attr_dev(path, "stroke-linecap", "round");
    			attr_dev(path, "stroke-linejoin", "round");
    			attr_dev(path, "d", "M6 18 18 6M6 6l12 12");
    			add_location(path, file$2, 137, 24, 5189);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "stroke-width", "1.5");
    			attr_dev(svg, "stroke", "currentColor");
    			attr_dev(svg, "class", "w-6 h-6");
    			add_location(svg, file$2, 129, 20, 4870);
    			attr_dev(button0, "class", "ml-auto flex");
    			add_location(button0, file$2, 120, 16, 4571);
    			attr_dev(div0, "class", "flex items-center");
    			add_location(div0, file$2, 117, 12, 4410);
    			attr_dev(p2, "class", "py-3");
    			add_location(p2, file$2, 145, 12, 5462);
    			attr_dev(p3, "class", "py-3");
    			add_location(p3, file$2, 147, 12, 5545);
    			add_location(p4, file$2, 150, 12, 5654);
    			attr_dev(input, "type", "range");
    			attr_dev(input, "class", "appearance-none w-full h-1 bg-gray-300 rounded-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-[20px] [&::-webkit-slider-thumb]:h-[20px] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#5c4f9e] ");
    			attr_dev(input, "min", "1");
    			attr_dev(input, "max", "20");
    			add_location(input, file$2, 152, 12, 5710);
    			attr_dev(p5, "class", "py-3");
    			add_location(p5, file$2, 171, 12, 6349);
    			add_location(p6, file$2, 173, 12, 6497);

    			attr_dev(button1, "class", button1_class_value = "px-4 py-2 my-2 rounded-full " + (/*selectedButton*/ ctx[1] === 'Math'
    			? 'bg-violet-200'
    			: 'bg-gray-200'));

    			add_location(button1, file$2, 178, 20, 6693);

    			attr_dev(button2, "class", button2_class_value = "px-4 py-2 my-2 ml-2 rounded-full " + (/*selectedButton*/ ctx[1] === 'Science'
    			? 'bg-violet-200'
    			: 'bg-gray-200'));

    			add_location(button2, file$2, 190, 20, 7190);

    			attr_dev(button3, "class", button3_class_value = "px-4 py-2 my-2 mx-2 rounded-full " + (/*selectedButton*/ ctx[1] === 'English'
    			? 'bg-violet-200'
    			: 'bg-gray-200'));

    			add_location(button3, file$2, 202, 20, 7704);

    			attr_dev(button4, "class", button4_class_value = "px-4 py-2 my-2 rounded-full " + (/*selectedButton*/ ctx[1] === 'History'
    			? 'bg-violet-200'
    			: 'bg-gray-200'));

    			add_location(button4, file$2, 214, 20, 8218);

    			attr_dev(button5, "class", button5_class_value = "px-4 py-2 my-2 ml-2 rounded-full " + (/*selectedButton*/ ctx[1] === 'Miscellaneous'
    			? 'bg-violet-200'
    			: 'bg-gray-200'));

    			add_location(button5, file$2, 226, 20, 8727);
    			attr_dev(div1, "class", "flex");
    			add_location(div1, file$2, 177, 16, 6654);
    			attr_dev(div2, "class", "flex");
    			add_location(div2, file$2, 174, 12, 6537);
    			attr_dev(p7, "class", "py-1");
    			add_location(p7, file$2, 240, 12, 9290);
    			attr_dev(p8, "class", "py-3");
    			add_location(p8, file$2, 292, 12, 11693);
    			attr_dev(div3, "class", "bg-white p-10 rounded-md");
    			add_location(div3, file$2, 116, 8, 4359);
    			attr_dev(div4, "class", "fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex justify-center items-center");
    			add_location(div4, file$2, 113, 4, 4235);
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
    			mount_component(textinput, div3, null);
    			append_dev(div3, t7);
    			append_dev(div3, p3);
    			append_dev(div3, t8);
    			append_dev(div3, p4);
    			append_dev(p4, t9);
    			append_dev(p4, t10);
    			append_dev(div3, t11);
    			append_dev(div3, input);
    			set_input_value(input, /*numQuestions*/ ctx[2]);
    			append_dev(div3, t12);
    			append_dev(div3, p5);
    			append_dev(div3, t13);
    			append_dev(div3, p6);
    			append_dev(div3, t15);
    			append_dev(div3, div2);
    			append_dev(div2, div1);
    			append_dev(div1, button1);
    			append_dev(button1, t16);
    			append_dev(div1, t17);
    			append_dev(div1, button2);
    			append_dev(button2, t18);
    			append_dev(div1, t19);
    			append_dev(div1, button3);
    			append_dev(button3, t20);
    			append_dev(div1, t21);
    			append_dev(div1, button4);
    			append_dev(button4, t22);
    			append_dev(div1, t23);
    			append_dev(div1, button5);
    			append_dev(button5, t24);
    			append_dev(div3, t25);
    			append_dev(div3, p7);
    			append_dev(div3, t26);
    			if (if_block) if_block.m(div3, null);
    			append_dev(div3, t27);
    			append_dev(div3, p8);
    			append_dev(div3, t28);
    			mount_component(button6, div3, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler_1*/ ctx[6], false, false, false, false),
    					listen_dev(input, "change", /*input_change_input_handler*/ ctx[7]),
    					listen_dev(input, "input", /*input_change_input_handler*/ ctx[7]),
    					listen_dev(button1, "click", /*click_handler_2*/ ctx[8], false, false, false, false),
    					listen_dev(button2, "click", /*click_handler_3*/ ctx[9], false, false, false, false),
    					listen_dev(button3, "click", /*click_handler_4*/ ctx[10], false, false, false, false),
    					listen_dev(button4, "click", /*click_handler_5*/ ctx[11], false, false, false, false),
    					listen_dev(button5, "click", /*click_handler_6*/ ctx[12], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty & /*numQuestions*/ 4) set_data_dev(t10, /*numQuestions*/ ctx[2]);

    			if (dirty & /*numQuestions*/ 4) {
    				set_input_value(input, /*numQuestions*/ ctx[2]);
    			}

    			if (!current || dirty & /*selectedButton*/ 2 && button1_class_value !== (button1_class_value = "px-4 py-2 my-2 rounded-full " + (/*selectedButton*/ ctx[1] === 'Math'
    			? 'bg-violet-200'
    			: 'bg-gray-200'))) {
    				attr_dev(button1, "class", button1_class_value);
    			}

    			if (!current || dirty & /*selectedButton*/ 2 && button2_class_value !== (button2_class_value = "px-4 py-2 my-2 ml-2 rounded-full " + (/*selectedButton*/ ctx[1] === 'Science'
    			? 'bg-violet-200'
    			: 'bg-gray-200'))) {
    				attr_dev(button2, "class", button2_class_value);
    			}

    			if (!current || dirty & /*selectedButton*/ 2 && button3_class_value !== (button3_class_value = "px-4 py-2 my-2 mx-2 rounded-full " + (/*selectedButton*/ ctx[1] === 'English'
    			? 'bg-violet-200'
    			: 'bg-gray-200'))) {
    				attr_dev(button3, "class", button3_class_value);
    			}

    			if (!current || dirty & /*selectedButton*/ 2 && button4_class_value !== (button4_class_value = "px-4 py-2 my-2 rounded-full " + (/*selectedButton*/ ctx[1] === 'History'
    			? 'bg-violet-200'
    			: 'bg-gray-200'))) {
    				attr_dev(button4, "class", button4_class_value);
    			}

    			if (!current || dirty & /*selectedButton*/ 2 && button5_class_value !== (button5_class_value = "px-4 py-2 my-2 ml-2 rounded-full " + (/*selectedButton*/ ctx[1] === 'Miscellaneous'
    			? 'bg-violet-200'
    			: 'bg-gray-200'))) {
    				attr_dev(button5, "class", button5_class_value);
    			}

    			if (/*availableSubTopics*/ ctx[4].length != 0) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_1$1(ctx);
    					if_block.c();
    					if_block.m(div3, t27);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(textinput.$$.fragment, local);
    			transition_in(button6.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(textinput.$$.fragment, local);
    			transition_out(button6.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    			destroy_component(textinput);
    			if (if_block) if_block.d();
    			destroy_component(button6);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(113:0) {#if createGameModal}",
    		ctx
    	});

    	return block;
    }

    // (242:12) {#if availableSubTopics.length != 0}
    function create_if_block_1$1(ctx) {
    	let p0;
    	let t1;
    	let p1;
    	let t2;
    	let each_1_anchor;
    	let each_value = /*availableSubTopics*/ ctx[4];
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
    			add_location(p0, file$2, 242, 16, 9376);
    			attr_dev(p1, "class", "py-1");
    			add_location(p1, file$2, 243, 16, 9421);
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
    			if (dirty & /*availableSubTopics, selectedSubTopics*/ 24) {
    				each_value = /*availableSubTopics*/ ctx[4];
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
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(242:12) {#if availableSubTopics.length != 0}",
    		ctx
    	});

    	return block;
    }

    // (272:24) {#if selectedSubTopics.includes(subTopic)}
    function create_if_block_2$1(ctx) {
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
    			add_location(path, file$2, 280, 32, 11238);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "stroke-width", "1.5");
    			attr_dev(svg, "stroke", "currentColor");
    			attr_dev(svg, "class", "w-5 h-5");
    			add_location(svg, file$2, 272, 28, 10855);
    			attr_dev(p, "class", "px-1");
    			add_location(p, file$2, 286, 28, 11523);
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
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(272:24) {#if selectedSubTopics.includes(subTopic)}",
    		ctx
    	});

    	return block;
    }

    // (245:16) {#each availableSubTopics as subTopic, i}
    function create_each_block$2(ctx) {
    	let button;
    	let show_if = /*selectedSubTopics*/ ctx[3].includes(/*subTopic*/ ctx[14]);
    	let t0;
    	let t1_value = /*subTopic*/ ctx[14] + "";
    	let t1;
    	let t2;
    	let button_class_value;
    	let mounted;
    	let dispose;
    	let if_block = show_if && create_if_block_2$1(ctx);

    	function click_handler_7() {
    		return /*click_handler_7*/ ctx[13](/*subTopic*/ ctx[14]);
    	}

    	const block = {
    		c: function create() {
    			button = element("button");
    			if (if_block) if_block.c();
    			t0 = space();
    			t1 = text(t1_value);
    			t2 = space();

    			attr_dev(button, "class", button_class_value = "flex items-center px-4 py-2 " + (/*i*/ ctx[16] == 0 ? 'rounded-t-md' : '') + " " + (/*i*/ ctx[16] == /*availableSubTopics*/ ctx[4].length - 1
    			? 'rounded-b-md'
    			: '') + " w-full border-neutral-400 " + (/*i*/ ctx[16] != 0 ? 'border-t-[1px]' : '') + " text-left " + (/*selectedSubTopics*/ ctx[3].includes(/*subTopic*/ ctx[14])
    			? 'bg-violet-200'
    			: 'bg-gray-200'));

    			add_location(button, file$2, 245, 20, 9520);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			if (if_block) if_block.m(button, null);
    			append_dev(button, t0);
    			append_dev(button, t1);
    			append_dev(button, t2);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler_7, false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*selectedSubTopics, availableSubTopics*/ 24) show_if = /*selectedSubTopics*/ ctx[3].includes(/*subTopic*/ ctx[14]);

    			if (show_if) {
    				if (if_block) ; else {
    					if_block = create_if_block_2$1(ctx);
    					if_block.c();
    					if_block.m(button, t0);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*availableSubTopics*/ 16 && t1_value !== (t1_value = /*subTopic*/ ctx[14] + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*availableSubTopics, selectedSubTopics*/ 24 && button_class_value !== (button_class_value = "flex items-center px-4 py-2 " + (/*i*/ ctx[16] == 0 ? 'rounded-t-md' : '') + " " + (/*i*/ ctx[16] == /*availableSubTopics*/ ctx[4].length - 1
    			? 'rounded-b-md'
    			: '') + " w-full border-neutral-400 " + (/*i*/ ctx[16] != 0 ? 'border-t-[1px]' : '') + " text-left " + (/*selectedSubTopics*/ ctx[3].includes(/*subTopic*/ ctx[14])
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
    		source: "(245:16) {#each availableSubTopics as subTopic, i}",
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
    	let a4;
    	let t11;
    	let li7;
    	let t12;
    	let li8;
    	let button0;
    	let img1;
    	let img1_src_value;
    	let t13;
    	let p0;
    	let t14;
    	let svg;
    	let path;
    	let t15;
    	let div9;
    	let div1;
    	let h1;
    	let t17;
    	let button1;
    	let t18;
    	let p1;
    	let t19;
    	let div8;
    	let div3;
    	let h20;
    	let t21;
    	let p2;
    	let t22;
    	let p3;
    	let t24;
    	let p4;
    	let t25;
    	let div2;
    	let button2;
    	let t26;
    	let p5;
    	let t27;
    	let altbutton0;
    	let t28;
    	let div5;
    	let h21;
    	let t30;
    	let p6;
    	let t31;
    	let p7;
    	let t33;
    	let p8;
    	let t34;
    	let div4;
    	let button3;
    	let t35;
    	let p9;
    	let t36;
    	let altbutton1;
    	let t37;
    	let div7;
    	let h22;
    	let t39;
    	let p10;
    	let t40;
    	let p11;
    	let t42;
    	let p12;
    	let t43;
    	let div6;
    	let button4;
    	let t44;
    	let p13;
    	let t45;
    	let altbutton2;
    	let t46;
    	let if_block_anchor;
    	let current;

    	button1 = new Button({
    			props: { label: "Create a Game" },
    			$$inline: true
    		});

    	button1.$on("click", /*click_handler*/ ctx[5]);
    	button2 = new Button({ props: { label: "Play" }, $$inline: true });

    	altbutton0 = new AltButton({
    			props: {
    				label: "Delete",
    				color: "#dc3545",
    				textColor: "white"
    			},
    			$$inline: true
    		});

    	button3 = new Button({ props: { label: "Play" }, $$inline: true });

    	altbutton1 = new AltButton({
    			props: {
    				label: "Delete",
    				color: "#dc3545",
    				textColor: "white"
    			},
    			$$inline: true
    		});

    	button4 = new Button({ props: { label: "Play" }, $$inline: true });

    	altbutton2 = new AltButton({
    			props: {
    				label: "Delete",
    				color: "#dc3545",
    				textColor: "white"
    			},
    			$$inline: true
    		});

    	let if_block = /*createGameModal*/ ctx[0] && create_if_block$1(ctx);

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
    			a2.textContent = "Create a Game";
    			t5 = space();
    			li3 = element("li");
    			t6 = space();
    			li4 = element("li");
    			a3 = element("a");
    			a3.textContent = "Leaderboard";
    			t8 = space();
    			li5 = element("li");
    			t9 = space();
    			li6 = element("li");
    			a4 = element("a");
    			a4.textContent = "About";
    			t11 = space();
    			li7 = element("li");
    			t12 = space();
    			li8 = element("li");
    			button0 = element("button");
    			img1 = element("img");
    			t13 = space();
    			p0 = element("p");
    			t14 = space();
    			svg = svg_element("svg");
    			path = svg_element("path");
    			t15 = space();
    			div9 = element("div");
    			div1 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Your Games";
    			t17 = space();
    			create_component(button1.$$.fragment);
    			t18 = space();
    			p1 = element("p");
    			t19 = space();
    			div8 = element("div");
    			div3 = element("div");
    			h20 = element("h2");
    			h20.textContent = "Game 1";
    			t21 = space();
    			p2 = element("p");
    			t22 = space();
    			p3 = element("p");
    			p3.textContent = "This is a game that helps you learn about the solar system.";
    			t24 = space();
    			p4 = element("p");
    			t25 = space();
    			div2 = element("div");
    			create_component(button2.$$.fragment);
    			t26 = space();
    			p5 = element("p");
    			t27 = space();
    			create_component(altbutton0.$$.fragment);
    			t28 = space();
    			div5 = element("div");
    			h21 = element("h2");
    			h21.textContent = "Game 2";
    			t30 = space();
    			p6 = element("p");
    			t31 = space();
    			p7 = element("p");
    			p7.textContent = "This is a game that helps you learn about the solar system.";
    			t33 = space();
    			p8 = element("p");
    			t34 = space();
    			div4 = element("div");
    			create_component(button3.$$.fragment);
    			t35 = space();
    			p9 = element("p");
    			t36 = space();
    			create_component(altbutton1.$$.fragment);
    			t37 = space();
    			div7 = element("div");
    			h22 = element("h2");
    			h22.textContent = "Game 3";
    			t39 = space();
    			p10 = element("p");
    			t40 = space();
    			p11 = element("p");
    			p11.textContent = "This is a game that helps you learn about the solar system.";
    			t42 = space();
    			p12 = element("p");
    			t43 = space();
    			div6 = element("div");
    			create_component(button4.$$.fragment);
    			t44 = space();
    			p13 = element("p");
    			t45 = space();
    			create_component(altbutton2.$$.fragment);
    			t46 = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			if (!src_url_equal(img0.src, img0_src_value = "./assets/logo_expanded.svg")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "logo");
    			attr_dev(img0, "class", "w-60");
    			add_location(img0, file$2, 21, 12, 805);
    			attr_dev(a0, "href", "/");
    			add_location(a0, file$2, 20, 8, 780);
    			attr_dev(div0, "class", "flex");
    			add_location(div0, file$2, 19, 4, 753);
    			attr_dev(a1, "href", "/");
    			add_location(a1, file$2, 26, 34, 977);
    			attr_dev(li0, "class", "font-bold");
    			add_location(li0, file$2, 26, 12, 955);
    			attr_dev(li1, "class", "px-2");
    			add_location(li1, file$2, 27, 12, 1015);
    			attr_dev(a2, "href", "/");
    			add_location(a2, file$2, 28, 34, 1072);
    			attr_dev(li2, "class", "font-bold");
    			add_location(li2, file$2, 28, 12, 1050);
    			attr_dev(li3, "class", "px-2");
    			add_location(li3, file$2, 29, 12, 1119);
    			attr_dev(a3, "href", "/#/leaderboard");
    			add_location(a3, file$2, 30, 34, 1176);
    			attr_dev(li4, "class", "font-bold");
    			add_location(li4, file$2, 30, 12, 1154);
    			attr_dev(li5, "class", "px-2");
    			add_location(li5, file$2, 31, 12, 1234);
    			attr_dev(a4, "href", "/about");
    			add_location(a4, file$2, 32, 34, 1291);
    			attr_dev(li6, "class", "font-bold");
    			add_location(li6, file$2, 32, 12, 1269);
    			attr_dev(li7, "class", "px-2");
    			add_location(li7, file$2, 33, 12, 1335);
    			if (!src_url_equal(img1.src, img1_src_value = "../../assets/account.png")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "user");
    			attr_dev(img1, "class", "w-10");
    			add_location(img1, file$2, 36, 20, 1464);
    			attr_dev(p0, "class", "px-1");
    			add_location(p0, file$2, 41, 20, 1639);
    			attr_dev(path, "stroke-linecap", "round");
    			attr_dev(path, "stroke-linejoin", "round");
    			attr_dev(path, "d", "m19.5 8.25-7.5 7.5-7.5-7.5");
    			add_location(path, file$2, 50, 24, 1999);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "stroke-width", "1.5");
    			attr_dev(svg, "stroke", "currentColor");
    			attr_dev(svg, "class", "w-6 h-6");
    			add_location(svg, file$2, 42, 20, 1680);
    			attr_dev(button0, "class", "flex items-center");
    			add_location(button0, file$2, 35, 16, 1409);
    			attr_dev(li8, "class", "font-bold");
    			add_location(li8, file$2, 34, 12, 1370);
    			attr_dev(ul, "class", "flex items-center");
    			add_location(ul, file$2, 25, 8, 912);
    			add_location(nav, file$2, 24, 4, 898);
    			attr_dev(header, "class", "flex justify-between p-10 items-center");
    			add_location(header, file$2, 17, 0, 677);
    			attr_dev(h1, "class", "text-4xl font-bold font-vag");
    			add_location(h1, file$2, 65, 8, 2442);
    			attr_dev(div1, "class", "flex justify-between");
    			add_location(div1, file$2, 64, 4, 2399);
    			attr_dev(p1, "class", "py-3");
    			add_location(p1, file$2, 73, 4, 2659);
    			attr_dev(h20, "class", "text-2xl font-bold font-vag");
    			add_location(h20, file$2, 76, 12, 2779);
    			attr_dev(p2, "class", "py-3");
    			add_location(p2, file$2, 77, 12, 2843);
    			add_location(p3, file$2, 78, 12, 2876);
    			attr_dev(p4, "class", "py-3");
    			add_location(p4, file$2, 79, 12, 2955);
    			attr_dev(p5, "class", "px-1");
    			add_location(p5, file$2, 82, 16, 3063);
    			attr_dev(div2, "class", "flex");
    			add_location(div2, file$2, 80, 12, 2988);
    			attr_dev(div3, "class", "bg-white rounded-md p-5");
    			add_location(div3, file$2, 75, 8, 2729);
    			attr_dev(h21, "class", "text-2xl font-bold font-vag");
    			add_location(h21, file$2, 87, 12, 3255);
    			attr_dev(p6, "class", "py-3");
    			add_location(p6, file$2, 88, 12, 3319);
    			add_location(p7, file$2, 89, 12, 3352);
    			attr_dev(p8, "class", "py-3");
    			add_location(p8, file$2, 90, 12, 3431);
    			attr_dev(p9, "class", "px-1");
    			add_location(p9, file$2, 93, 16, 3539);
    			attr_dev(div4, "class", "flex");
    			add_location(div4, file$2, 91, 12, 3464);
    			attr_dev(div5, "class", "bg-white rounded-md p-5");
    			add_location(div5, file$2, 86, 8, 3205);
    			attr_dev(h22, "class", "text-2xl font-bold font-vag");
    			add_location(h22, file$2, 98, 12, 3731);
    			attr_dev(p10, "class", "py-3");
    			add_location(p10, file$2, 99, 12, 3795);
    			add_location(p11, file$2, 100, 12, 3828);
    			attr_dev(p12, "class", "py-3");
    			add_location(p12, file$2, 101, 12, 3907);
    			attr_dev(p13, "class", "px-1");
    			add_location(p13, file$2, 104, 16, 4015);
    			attr_dev(div6, "class", "flex");
    			add_location(div6, file$2, 102, 12, 3940);
    			attr_dev(div7, "class", "bg-white rounded-md p-5");
    			add_location(div7, file$2, 97, 8, 3681);
    			attr_dev(div8, "class", "grid grid-cols-3 gap-5");
    			add_location(div8, file$2, 74, 4, 2684);
    			attr_dev(div9, "class", "py-3 px-10");
    			add_location(div9, file$2, 63, 0, 2370);
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
    			append_dev(li6, a4);
    			append_dev(ul, t11);
    			append_dev(ul, li7);
    			append_dev(ul, t12);
    			append_dev(ul, li8);
    			append_dev(li8, button0);
    			append_dev(button0, img1);
    			append_dev(button0, t13);
    			append_dev(button0, p0);
    			append_dev(button0, t14);
    			append_dev(button0, svg);
    			append_dev(svg, path);
    			insert_dev(target, t15, anchor);
    			insert_dev(target, div9, anchor);
    			append_dev(div9, div1);
    			append_dev(div1, h1);
    			append_dev(div1, t17);
    			mount_component(button1, div1, null);
    			append_dev(div9, t18);
    			append_dev(div9, p1);
    			append_dev(div9, t19);
    			append_dev(div9, div8);
    			append_dev(div8, div3);
    			append_dev(div3, h20);
    			append_dev(div3, t21);
    			append_dev(div3, p2);
    			append_dev(div3, t22);
    			append_dev(div3, p3);
    			append_dev(div3, t24);
    			append_dev(div3, p4);
    			append_dev(div3, t25);
    			append_dev(div3, div2);
    			mount_component(button2, div2, null);
    			append_dev(div2, t26);
    			append_dev(div2, p5);
    			append_dev(div2, t27);
    			mount_component(altbutton0, div2, null);
    			append_dev(div8, t28);
    			append_dev(div8, div5);
    			append_dev(div5, h21);
    			append_dev(div5, t30);
    			append_dev(div5, p6);
    			append_dev(div5, t31);
    			append_dev(div5, p7);
    			append_dev(div5, t33);
    			append_dev(div5, p8);
    			append_dev(div5, t34);
    			append_dev(div5, div4);
    			mount_component(button3, div4, null);
    			append_dev(div4, t35);
    			append_dev(div4, p9);
    			append_dev(div4, t36);
    			mount_component(altbutton1, div4, null);
    			append_dev(div8, t37);
    			append_dev(div8, div7);
    			append_dev(div7, h22);
    			append_dev(div7, t39);
    			append_dev(div7, p10);
    			append_dev(div7, t40);
    			append_dev(div7, p11);
    			append_dev(div7, t42);
    			append_dev(div7, p12);
    			append_dev(div7, t43);
    			append_dev(div7, div6);
    			mount_component(button4, div6, null);
    			append_dev(div6, t44);
    			append_dev(div6, p13);
    			append_dev(div6, t45);
    			mount_component(altbutton2, div6, null);
    			insert_dev(target, t46, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*createGameModal*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*createGameModal*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button1.$$.fragment, local);
    			transition_in(button2.$$.fragment, local);
    			transition_in(altbutton0.$$.fragment, local);
    			transition_in(button3.$$.fragment, local);
    			transition_in(altbutton1.$$.fragment, local);
    			transition_in(button4.$$.fragment, local);
    			transition_in(altbutton2.$$.fragment, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button1.$$.fragment, local);
    			transition_out(button2.$$.fragment, local);
    			transition_out(altbutton0.$$.fragment, local);
    			transition_out(button3.$$.fragment, local);
    			transition_out(altbutton1.$$.fragment, local);
    			transition_out(button4.$$.fragment, local);
    			transition_out(altbutton2.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(header);
    			if (detaching) detach_dev(t15);
    			if (detaching) detach_dev(div9);
    			destroy_component(button1);
    			destroy_component(button2);
    			destroy_component(altbutton0);
    			destroy_component(button3);
    			destroy_component(altbutton1);
    			destroy_component(button4);
    			destroy_component(altbutton2);
    			if (detaching) detach_dev(t46);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
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
    	validate_slots('HomePage', slots, []);
    	let createGameModal = true;
    	let selectedButton = null;
    	let numQuestions = 1;
    	let selectedSubTopics = [];
    	let availableSubTopics = [];
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<HomePage> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => {
    		$$invalidate(0, createGameModal = true);
    	};

    	const click_handler_1 = () => {
    		$$invalidate(0, createGameModal = false);
    	};

    	function input_change_input_handler() {
    		numQuestions = to_number(this.value);
    		$$invalidate(2, numQuestions);
    	}

    	const click_handler_2 = () => {
    		$$invalidate(1, selectedButton = "Math");
    		$$invalidate(4, availableSubTopics = mathSubTopics);
    	};

    	const click_handler_3 = () => {
    		$$invalidate(1, selectedButton = "Science");
    		$$invalidate(4, availableSubTopics = scienceSubTopics);
    	};

    	const click_handler_4 = () => {
    		$$invalidate(1, selectedButton = "English");
    		$$invalidate(4, availableSubTopics = englishSubTopics);
    	};

    	const click_handler_5 = () => {
    		$$invalidate(1, selectedButton = "History");
    		$$invalidate(4, availableSubTopics = historySubTopics);
    	};

    	const click_handler_6 = () => {
    		$$invalidate(1, selectedButton = "Miscellaneous");
    		$$invalidate(4, availableSubTopics = miscSubTopics);
    	};

    	const click_handler_7 = subTopic => {
    		if (selectedSubTopics.includes(subTopic)) {
    			delete selectedSubTopics[selectedSubTopics.indexOf(subTopic)];
    			$$invalidate(3, selectedSubTopics);
    		} else {
    			$$invalidate(3, selectedSubTopics = [
    				//...selectedSubTopics,
    				subTopic
    			]);
    		}
    	};

    	$$self.$capture_state = () => ({
    		Button,
    		AltButton,
    		TextInput,
    		mathSubTopics,
    		scienceSubTopics,
    		englishSubTopics,
    		historySubTopics,
    		miscSubTopics,
    		createGameModal,
    		selectedButton,
    		numQuestions,
    		selectedSubTopics,
    		availableSubTopics
    	});

    	$$self.$inject_state = $$props => {
    		if ('createGameModal' in $$props) $$invalidate(0, createGameModal = $$props.createGameModal);
    		if ('selectedButton' in $$props) $$invalidate(1, selectedButton = $$props.selectedButton);
    		if ('numQuestions' in $$props) $$invalidate(2, numQuestions = $$props.numQuestions);
    		if ('selectedSubTopics' in $$props) $$invalidate(3, selectedSubTopics = $$props.selectedSubTopics);
    		if ('availableSubTopics' in $$props) $$invalidate(4, availableSubTopics = $$props.availableSubTopics);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		createGameModal,
    		selectedButton,
    		numQuestions,
    		selectedSubTopics,
    		availableSubTopics,
    		click_handler,
    		click_handler_1,
    		input_change_input_handler,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4,
    		click_handler_5,
    		click_handler_6,
    		click_handler_7
    	];
    }

    class HomePage extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "HomePage",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src/pages/PlayPage.svelte generated by Svelte v3.59.2 */
    const file$1 = "src/pages/PlayPage.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[12] = list[i];
    	child_ctx[14] = i;
    	return child_ctx;
    }

    // (28:12) <AltButton label="Exit Game" color="#dc3545" textColor="white"                 >
    function create_default_slot(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Exit Game");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(28:12) <AltButton label=\\\"Exit Game\\\" color=\\\"#dc3545\\\" textColor=\\\"white\\\"                 >",
    		ctx
    	});

    	return block;
    }

    // (41:12) {#each options as option, i}
    function create_each_block$1(ctx) {
    	let li;
    	let button;
    	let p;
    	let t0_value = /*option*/ ctx[12] + "";
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			li = element("li");
    			button = element("button");
    			p = element("p");
    			t0 = text(t0_value);
    			t1 = space();
    			attr_dev(p, "class", "pl-7 pr-44 py-12");
    			add_location(p, file$1, 52, 24, 1749);
    			attr_dev(button, "class", "" + (/*colors*/ ctx[2][/*i*/ ctx[14]] + " w-full hover:bg-opacity-90 active:bg-opacity-85 text-3xl text-white text-left border-b " + (/*i*/ ctx[14] === 0 ? 'rounded-tl-2xl' : '') + " " + (/*i*/ ctx[14] === 3 ? 'rounded-tr-2xl' : '') + " " + (/*i*/ ctx[14] === 0 ? 'rounded-bl-2xl' : '') + " " + (/*i*/ ctx[14] === 3 ? 'rounded-br-2xl' : '')));
    			add_location(button, file$1, 42, 20, 1238);
    			attr_dev(li, "class", "");
    			add_location(li, file$1, 41, 16, 1204);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, button);
    			append_dev(button, p);
    			append_dev(p, t0);
    			append_dev(li, t1);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(41:12) {#each options as option, i}",
    		ctx
    	});

    	return block;
    }

    // (70:12) {:else}
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
    			if (!src_url_equal(img.src, img_src_value = "./assets/powerups/double_jeap_disabled.svg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Double Jeapordy");
    			attr_dev(img, "class", "w-7");
    			attr_dev(img, "style", "");
    			add_location(img, file$1, 74, 20, 2513);
    			attr_dev(button, "class", "cursor-not-allowed py-5 px-5 rounded-full bg-gray-200");
    			add_location(button, file$1, 70, 16, 2356);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, img);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler_1*/ ctx[11], false, false, false, false);
    				mounted = true;
    			}
    		},
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
    		source: "(70:12) {:else}",
    		ctx
    	});

    	return block;
    }

    // (61:12) {#if djAvail}
    function create_if_block_2(ctx) {
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
    			attr_dev(img, "alt", "Double Jeapordy");
    			attr_dev(img, "class", "w-7");
    			attr_dev(img, "style", "");
    			add_location(img, file$1, 62, 20, 2087);
    			attr_dev(button, "class", "py-5 px-5 rounded-full bg-[#d4edda]");
    			add_location(button, file$1, 61, 16, 2005);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, img);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[10], false, false, false, false);
    				mounted = true;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(61:12) {#if djAvail}",
    		ctx
    	});

    	return block;
    }

    // (91:12) {:else}
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
    			if (!src_url_equal(img.src, img_src_value = "./assets/powerups/2x_disabled.svg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "2x");
    			attr_dev(img, "class", "w-10");
    			add_location(img, file$1, 94, 21, 3257);
    			attr_dev(button, "class", "cursor-not-allowed py-2 px-3.5 rounded-full bg-gray-200");
    			add_location(button, file$1, 91, 16, 3115);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, img);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler_3*/ ctx[9], false, false, false, false);
    				mounted = true;
    			}
    		},
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
    		source: "(91:12) {:else}",
    		ctx
    	});

    	return block;
    }

    // (83:12) {#if twoAvail}
    function create_if_block_1(ctx) {
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
    			add_location(img, file$1, 84, 21, 2900);
    			attr_dev(button, "class", "py-2 px-3.5 rounded-full bg-[#cce5ff]");
    			add_location(button, file$1, 83, 16, 2816);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, img);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler_2*/ ctx[8], false, false, false, false);
    				mounted = true;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(83:12) {#if twoAvail}",
    		ctx
    	});

    	return block;
    }

    // (112:12) {:else}
    function create_else_block(ctx) {
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
    			add_location(img, file$1, 115, 21, 4001);
    			attr_dev(button, "class", "cursor-not-allowed py-2 px-[18px] rounded-full bg-gray-200");
    			add_location(button, file$1, 112, 16, 3856);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, img);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler_5*/ ctx[7], false, false, false, false);
    				mounted = true;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(112:12) {:else}",
    		ctx
    	});

    	return block;
    }

    // (102:12) {#if psAvail}
    function create_if_block(ctx) {
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
    			add_location(img, file$1, 105, 21, 3632);
    			attr_dev(button, "class", "py-2 px-[18px] rounded-full bg-[#ede2d4]");
    			add_location(button, file$1, 102, 16, 3505);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, img);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler_4*/ ctx[6], false, false, false, false);
    				mounted = true;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(102:12) {#if psAvail}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
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
    	let div3;
    	let div2;
    	let h2;
    	let t3;
    	let ul1;
    	let t4;
    	let div1;
    	let t5;
    	let t6;
    	let current;

    	altbutton = new AltButton({
    			props: {
    				label: "Exit Game",
    				color: "#dc3545",
    				textColor: "white",
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	let each_value = /*options*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	function select_block_type(ctx, dirty) {
    		if (/*djAvail*/ ctx[3]) return create_if_block_2;
    		return create_else_block_2;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type(ctx);

    	function select_block_type_1(ctx, dirty) {
    		if (/*twoAvail*/ ctx[4]) return create_if_block_1;
    		return create_else_block_1;
    	}

    	let current_block_type_1 = select_block_type_1(ctx);
    	let if_block1 = current_block_type_1(ctx);

    	function select_block_type_2(ctx, dirty) {
    		if (/*psAvail*/ ctx[5]) return create_if_block;
    		return create_else_block;
    	}

    	let current_block_type_2 = select_block_type_2(ctx);
    	let if_block2 = current_block_type_2(ctx);

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
    			div3 = element("div");
    			div2 = element("div");
    			h2 = element("h2");
    			h2.textContent = `${/*question*/ ctx[0]}`;
    			t3 = space();
    			ul1 = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t4 = space();
    			div1 = element("div");
    			if_block0.c();
    			t5 = space();
    			if_block1.c();
    			t6 = space();
    			if_block2.c();
    			if (!src_url_equal(img.src, img_src_value = "./assets/logo_expanded.svg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "logo");
    			attr_dev(img, "class", "w-60");
    			add_location(img, file$1, 22, 12, 599);
    			attr_dev(a, "href", "/");
    			add_location(a, file$1, 21, 8, 574);
    			attr_dev(div0, "class", "flex");
    			add_location(div0, file$1, 20, 4, 547);
    			attr_dev(ul0, "class", "flex items-center");
    			add_location(ul0, file$1, 26, 8, 706);
    			add_location(nav, file$1, 25, 4, 692);
    			attr_dev(header, "class", "flex justify-between p-10 items-center");
    			add_location(header, file$1, 18, 0, 471);
    			attr_dev(h2, "class", "text-6xl mb-10");
    			add_location(h2, file$1, 38, 8, 1056);
    			attr_dev(ul1, "class", "grid grid-cols-4 gap-[1px]");
    			add_location(ul1, file$1, 39, 8, 1107);
    			attr_dev(div1, "class", "flex mt-10 -mb-8 gap-2");
    			add_location(div1, file$1, 59, 8, 1926);
    			attr_dev(div2, "class", "p-20 bg-white rounded-2xl shadow-lg");
    			add_location(div2, file$1, 37, 4, 998);
    			attr_dev(div3, "class", "flex flex-col items-center justify-center bg-gray-100 p-10 overflow-hidden");
    			add_location(div3, file$1, 34, 0, 900);
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
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div2);
    			append_dev(div2, h2);
    			append_dev(div2, t3);
    			append_dev(div2, ul1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(ul1, null);
    				}
    			}

    			append_dev(div2, t4);
    			append_dev(div2, div1);
    			if_block0.m(div1, null);
    			append_dev(div1, t5);
    			if_block1.m(div1, null);
    			append_dev(div1, t6);
    			if_block2.m(div1, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const altbutton_changes = {};

    			if (dirty & /*$$scope*/ 32768) {
    				altbutton_changes.$$scope = { dirty, ctx };
    			}

    			altbutton.$set(altbutton_changes);

    			if (dirty & /*colors, options*/ 6) {
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
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(altbutton.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(altbutton.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(header);
    			destroy_component(altbutton);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div3);
    			destroy_each(each_blocks, detaching);
    			if_block0.d();
    			if_block1.d();
    			if_block2.d();
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
    	validate_slots('PlayPage', slots, []);
    	let question = "What is the capital of France?";
    	let options = ["Paris", "London", "Berlin", "Madrid"];
    	let colors = ["bg-fuchsia-900", "bg-purple-900", "bg-violet-950", "bg-indigo-950"];
    	let djAvail = true;
    	let twoAvail = true;
    	let psAvail = true;
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<PlayPage> was created with unknown prop '${key}'`);
    	});

    	function click_handler_4(event) {
    		bubble.call(this, $$self, event);
    	}

    	function click_handler_5(event) {
    		bubble.call(this, $$self, event);
    	}

    	function click_handler_2(event) {
    		bubble.call(this, $$self, event);
    	}

    	function click_handler_3(event) {
    		bubble.call(this, $$self, event);
    	}

    	function click_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function click_handler_1(event) {
    		bubble.call(this, $$self, event);
    	}

    	$$self.$capture_state = () => ({
    		AltButton,
    		question,
    		options,
    		colors,
    		djAvail,
    		twoAvail,
    		psAvail
    	});

    	$$self.$inject_state = $$props => {
    		if ('question' in $$props) $$invalidate(0, question = $$props.question);
    		if ('options' in $$props) $$invalidate(1, options = $$props.options);
    		if ('colors' in $$props) $$invalidate(2, colors = $$props.colors);
    		if ('djAvail' in $$props) $$invalidate(3, djAvail = $$props.djAvail);
    		if ('twoAvail' in $$props) $$invalidate(4, twoAvail = $$props.twoAvail);
    		if ('psAvail' in $$props) $$invalidate(5, psAvail = $$props.psAvail);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		question,
    		options,
    		colors,
    		djAvail,
    		twoAvail,
    		psAvail,
    		click_handler_4,
    		click_handler_5,
    		click_handler_2,
    		click_handler_3,
    		click_handler,
    		click_handler_1
    	];
    }

    class PlayPage extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "PlayPage",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src/pages/Leaderboard.svelte generated by Svelte v3.59.2 */

    const file = "src/pages/Leaderboard.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i].name;
    	child_ctx[2] = list[i].score;
    	child_ctx[4] = i;
    	return child_ctx;
    }

    // (98:12) {#each leaderboard as { name, score }
    function create_each_block(ctx) {
    	let tr;
    	let td0;
    	let t0_value = /*name*/ ctx[1] + "";
    	let t0;
    	let t1;
    	let td1;
    	let t2_value = /*score*/ ctx[2] + "";
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
    			add_location(td0, file, 103, 20, 3791);
    			attr_dev(td1, "class", "border-gray-300 text-center px-4 py-2");
    			add_location(td1, file, 104, 20, 3861);
    			attr_dev(tr, "class", "table table-fixed w-[100%] " + (/*i*/ ctx[4] % 2 == 0 ? 'bg-gray-200' : ''));
    			add_location(tr, file, 98, 16, 3612);
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
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(98:12) {#each leaderboard as { name, score }",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
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
    	let a4;
    	let t11;
    	let li7;
    	let t12;
    	let li8;
    	let button;
    	let img1;
    	let img1_src_value;
    	let t13;
    	let p0;
    	let t14;
    	let svg;
    	let path;
    	let t15;
    	let div1;
    	let h1;
    	let t17;
    	let table;
    	let thead;
    	let tr;
    	let th0;
    	let t19;
    	let th1;
    	let t21;
    	let tbody;
    	let t22;
    	let p1;
    	let each_value = /*leaderboard*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

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
    			a2.textContent = "Create a Game";
    			t5 = space();
    			li3 = element("li");
    			t6 = space();
    			li4 = element("li");
    			a3 = element("a");
    			a3.textContent = "Leaderboard";
    			t8 = space();
    			li5 = element("li");
    			t9 = space();
    			li6 = element("li");
    			a4 = element("a");
    			a4.textContent = "About";
    			t11 = space();
    			li7 = element("li");
    			t12 = space();
    			li8 = element("li");
    			button = element("button");
    			img1 = element("img");
    			t13 = space();
    			p0 = element("p");
    			t14 = space();
    			svg = svg_element("svg");
    			path = svg_element("path");
    			t15 = space();
    			div1 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Leaderboard";
    			t17 = space();
    			table = element("table");
    			thead = element("thead");
    			tr = element("tr");
    			th0 = element("th");
    			th0.textContent = "Name";
    			t19 = space();
    			th1 = element("th");
    			th1.textContent = "Score";
    			t21 = space();
    			tbody = element("tbody");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t22 = space();
    			p1 = element("p");
    			if (!src_url_equal(img0.src, img0_src_value = "./assets/logo_expanded.svg")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "logo");
    			attr_dev(img0, "class", "w-60");
    			add_location(img0, file, 46, 12, 1651);
    			attr_dev(a0, "href", "/");
    			add_location(a0, file, 45, 8, 1626);
    			attr_dev(div0, "class", "flex");
    			add_location(div0, file, 44, 4, 1599);
    			attr_dev(a1, "href", "/");
    			add_location(a1, file, 51, 34, 1823);
    			attr_dev(li0, "class", "font-bold");
    			add_location(li0, file, 51, 12, 1801);
    			attr_dev(li1, "class", "px-2");
    			add_location(li1, file, 52, 12, 1861);
    			attr_dev(a2, "href", "/");
    			add_location(a2, file, 53, 34, 1918);
    			attr_dev(li2, "class", "font-bold");
    			add_location(li2, file, 53, 12, 1896);
    			attr_dev(li3, "class", "px-2");
    			add_location(li3, file, 54, 12, 1965);
    			attr_dev(a3, "href", "/#/leaderboard");
    			add_location(a3, file, 55, 34, 2022);
    			attr_dev(li4, "class", "font-bold");
    			add_location(li4, file, 55, 12, 2000);
    			attr_dev(li5, "class", "px-2");
    			add_location(li5, file, 56, 12, 2080);
    			attr_dev(a4, "href", "/about");
    			add_location(a4, file, 57, 34, 2137);
    			attr_dev(li6, "class", "font-bold");
    			add_location(li6, file, 57, 12, 2115);
    			attr_dev(li7, "class", "px-2");
    			add_location(li7, file, 58, 12, 2181);
    			if (!src_url_equal(img1.src, img1_src_value = "../../assets/account.png")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "user");
    			attr_dev(img1, "class", "w-10");
    			add_location(img1, file, 61, 20, 2310);
    			attr_dev(p0, "class", "px-1");
    			add_location(p0, file, 66, 20, 2485);
    			attr_dev(path, "stroke-linecap", "round");
    			attr_dev(path, "stroke-linejoin", "round");
    			attr_dev(path, "d", "m19.5 8.25-7.5 7.5-7.5-7.5");
    			add_location(path, file, 75, 24, 2845);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "stroke-width", "1.5");
    			attr_dev(svg, "stroke", "currentColor");
    			attr_dev(svg, "class", "w-6 h-6");
    			add_location(svg, file, 67, 20, 2526);
    			attr_dev(button, "class", "flex items-center");
    			add_location(button, file, 60, 16, 2255);
    			attr_dev(li8, "class", "font-bold");
    			add_location(li8, file, 59, 12, 2216);
    			attr_dev(ul, "class", "flex items-center");
    			add_location(ul, file, 50, 8, 1758);
    			add_location(nav, file, 49, 4, 1744);
    			attr_dev(header, "class", "flex justify-between p-10 items-center");
    			add_location(header, file, 42, 0, 1523);
    			attr_dev(h1, "class", "text-4xl font-bold mb-4 font-vag");
    			add_location(h1, file, 88, 4, 3188);
    			attr_dev(th0, "class", "px-4 py-2");
    			add_location(th0, file, 92, 16, 3372);
    			attr_dev(th1, "class", "px-4 py-2");
    			add_location(th1, file, 93, 16, 3420);
    			add_location(tr, file, 91, 12, 3351);
    			attr_dev(thead, "class", "table table-fixed w-[100%]");
    			add_location(thead, file, 90, 8, 3296);
    			attr_dev(tbody, "class", "h-[32rem] overflow-auto block");
    			add_location(tbody, file, 96, 8, 3496);
    			attr_dev(table, "class", "table-auto w-full");
    			add_location(table, file, 89, 4, 3254);
    			attr_dev(p1, "class", "py-10");
    			add_location(p1, file, 112, 4, 4077);
    			attr_dev(div1, "class", "container mx-auto px-4");
    			add_location(div1, file, 87, 0, 3147);
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
    			append_dev(li6, a4);
    			append_dev(ul, t11);
    			append_dev(ul, li7);
    			append_dev(ul, t12);
    			append_dev(ul, li8);
    			append_dev(li8, button);
    			append_dev(button, img1);
    			append_dev(button, t13);
    			append_dev(button, p0);
    			append_dev(button, t14);
    			append_dev(button, svg);
    			append_dev(svg, path);
    			insert_dev(target, t15, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, h1);
    			append_dev(div1, t17);
    			append_dev(div1, table);
    			append_dev(table, thead);
    			append_dev(thead, tr);
    			append_dev(tr, th0);
    			append_dev(tr, t19);
    			append_dev(tr, th1);
    			append_dev(table, t21);
    			append_dev(table, tbody);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(tbody, null);
    				}
    			}

    			append_dev(div1, t22);
    			append_dev(div1, p1);
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
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(header);
    			if (detaching) detach_dev(t15);
    			if (detaching) detach_dev(div1);
    			destroy_each(each_blocks, detaching);
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
    	validate_slots('Leaderboard', slots, []);

    	let leaderboard = [
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

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Leaderboard> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ leaderboard });

    	$$self.$inject_state = $$props => {
    		if ('leaderboard' in $$props) $$invalidate(0, leaderboard = $$props.leaderboard);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [leaderboard];
    }

    class Leaderboard extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Leaderboard",
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
    		"/leaderboard": Leaderboard
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
    		name: 'world'
    	}
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
