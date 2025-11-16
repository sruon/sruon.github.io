import { parseAction, getActionName, getMissName } from '/js/actionparser.js'

function hexToBytes(hex) {
  const bytes = []
  for (let i = 0; i < hex.length; i += 2) {
    bytes.push(parseInt(hex.substr(i, 2), 16))
  }
  return bytes
}

function formatBytes(bytes) {
  return bytes.map((b, i) => {
    const hex = '0x' + b.toString(16).padStart(2, '0').toUpperCase()
    return i % 16 === 0 ? (i > 0 ? '\n' + hex : hex) : ' ' + hex
  }).join('')
}

function formatActionAsLua(action) {
  return `{
    m_uID   = ${action.m_uID},
    trg_sum = ${action.trg_sum},
    res_sum = ${action.res_sum},
    cmd_no  = ${action.cmd_no}, -- ${getActionName(action.cmd_no)}
    cmd_arg = ${action.cmd_arg},
    info    = ${action.info},
    target  =
    {
${action.target.map(target => `        {
            m_uID      = ${target.m_uID},
            result_sum = ${target.result_sum},
            result     =
            {
${target.result.map(result => `                {
                    miss          = ${result.miss}, -- ${getMissName(result.miss)}
                    kind          = ${result.kind},
                    sub_kind      = ${result.sub_kind},
                    info          = ${result.info},
                    scale         = ${result.scale},
                    value         = ${result.value},
                    message       = ${result.message},
                    bit           = ${result.bit},
                    has_proc      = ${result.has_proc},
                    proc_kind     = ${result.proc_kind},
                    proc_info     = ${result.proc_info},
                    proc_value    = ${result.proc_value},
                    proc_message  = ${result.proc_message},
                    has_react     = ${result.has_react},
                    react_kind    = ${result.react_kind},
                    react_info    = ${result.react_info},
                    react_value   = ${result.react_value},
                    react_message = ${result.react_message},
                }`).join(',\n')},
            },
        }`).join(',\n')},
    },
}`
}

function generateSummary(action) {
  const casterId = action.m_uID.toString()

  if (action.target.length === 0) {
    return `Caster: ${casterId}`
  }

  const targetId = action.target[0].m_uID.toString()
  const targetCount = action.target.length

  if (action.cmd_no === 8) {
    const subKind = action.target[0]?.result[0]?.sub_kind
    if (subKind !== undefined) {
      const targetStr = targetCount > 1 ? `${targetId} +${targetCount - 1}` : targetId
      return `${casterId} → ${targetStr} (spell: ${subKind})`
    }
  }

  const targetStr = targetCount > 1 ? `${targetId} +${targetCount - 1}` : targetId
  return `${casterId} → ${targetStr}`
}

const contentDiv = document.getElementById('content')
const hash = window.location.hash.substring(1)

if (!hash) {
  contentDiv.innerHTML = '<div class="notification is-warning">No packet data in URL. Use a link from the parser page.</div>'
} else {
  try {
    const bytes = hexToBytes(hash)
    const action = parseAction(bytes)

    if (!action) {
      contentDiv.innerHTML = '<div class="notification is-danger">Invalid packet: First byte must be 0x28</div>'
    } else {
      contentDiv.innerHTML = `
        <div class="box">
          <h2 class="title is-4">${getActionName(action.cmd_no)}: ${generateSummary(action)}</h2>

          <h3 class="subtitle is-5">Raw Bytes (${bytes.length} bytes)</h3>
          <pre><code>${formatBytes(bytes)}</code></pre>

          <h3 class="subtitle is-5">Details</h3>
          <ul>
            <li>Caster: <code>${action.m_uID}</code></li>
            <li>Action: ${getActionName(action.cmd_no)} (cmd_no: ${action.cmd_no})</li>
            <li>Targets: ${action.trg_sum}</li>
            <li>Command Arg: <code>${action.cmd_arg}</code></li>
          </ul>

          <h3 class="subtitle is-5">Lua Format</h3>
          <pre><code>${formatActionAsLua(action)}</code></pre>
        </div>
      `
    }
  } catch (err) {
    contentDiv.innerHTML = `<div class="notification is-danger">Failed to parse packet: ${err.message}</div>`
  }
}
// Thank you to https://github.com/daviddarnes/heading-anchors
// Thank you to https://amberwilson.co.uk/blog/are-your-anchor-links-accessible/

let globalInstanceIndex = 0;

class HeadingAnchors extends HTMLElement {
	static register(tagName = "heading-anchors", registry = window.customElements) {
		if(registry && !registry.get(tagName)) {
			registry.define(tagName, this);
		}
	}

	static attributes = {
		exclude: "data-ha-exclude",
		prefix: "prefix",
		content: "content",
	}

	static classes = {
		anchor: "ha",
		placeholder: "ha-placeholder",
		srOnly: "ha-visualhide",
	}

	static defaultSelector = "h2,h3,h4,h5,h6";

	static css = `
.${HeadingAnchors.classes.srOnly} {
	clip: rect(0 0 0 0);
	height: 1px;
	overflow: hidden;
	position: absolute;
	width: 1px;
}
.${HeadingAnchors.classes.anchor} {
	position: absolute;
	left: var(--ha_offsetx);
	top: var(--ha_offsety);
	text-decoration: none;
	opacity: 0;
}
.${HeadingAnchors.classes.placeholder} {
	opacity: .3;
}
.${HeadingAnchors.classes.anchor}:is(:focus-within, :hover) {
	opacity: 1;
}
.${HeadingAnchors.classes.anchor},
.${HeadingAnchors.classes.placeholder} {
	display: inline-block;
	padding: 0 .25em;

	/* Disable selection of visually hidden label */
	-webkit-user-select: none;
	user-select: none;
}

@supports (anchor-name: none) {
	.${HeadingAnchors.classes.anchor} {
		position: absolute;
		left: anchor(left);
		top: anchor(top);
	}
}`;

	get supports() {
		return "replaceSync" in CSSStyleSheet.prototype;
	}

	get supportsAnchorPosition() {
		return CSS.supports("anchor-name: none");
	}

	constructor() {
		super();

		if(!this.supports) {
			return;
		}

		let sheet = new CSSStyleSheet();
		sheet.replaceSync(HeadingAnchors.css);
		document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];

		this.headingStyles = {};
		this.instanceIndex = globalInstanceIndex++;
	}

	connectedCallback() {
		if (!this.supports) {
			return;
		}

		this.headings.forEach((heading, index) => {
			if(!heading.hasAttribute(HeadingAnchors.attributes.exclude)) {
				let anchor = this.getAnchorElement(heading);
				let placeholder = this.getPlaceholderElement();

				// Prefers anchor position approach for better accessibility
				// https://amberwilson.co.uk/blog/are-your-anchor-links-accessible/
				if(this.supportsAnchorPosition) {
					let anchorName = `--ha_${this.instanceIndex}_${index}`;
					placeholder.style.setProperty("anchor-name", anchorName);
					anchor.style.positionAnchor = anchorName;
				}

				heading.appendChild(placeholder);
				heading.after(anchor);
			}
		});
	}

	// Polyfill-only
	positionAnchorFromPlaceholder(placeholder) {
		if(!placeholder) {
			return;
		}

		let heading = placeholder.closest("h1,h2,h3,h4,h5,h6");
		if(!heading.nextElementSibling) {
			return;
		}

		// TODO next element could be more defensive
		this.positionAnchor(heading.nextElementSibling);
	}

	// Polyfill-only
	positionAnchor(anchor) {
		if(!anchor || !anchor.previousElementSibling) {
			return;
		}

		// TODO previous element could be more defensive
		let heading = anchor.previousElementSibling;
		this.setFontProp(heading, anchor);

		if(this.supportsAnchorPosition) {
			// quit early
			return;
		}

		let placeholder = heading.querySelector(`.${HeadingAnchors.classes.placeholder}`);
		if(placeholder) {
			anchor.style.setProperty("--ha_offsetx", `${placeholder.offsetLeft}px`);
			anchor.style.setProperty("--ha_offsety", `${placeholder.offsetTop}px`);
		}
	}

	setFontProp(heading, anchor) {
		let placeholder = heading.querySelector(`.${HeadingAnchors.classes.placeholder}`);
		if(placeholder) {
			let style = getComputedStyle(placeholder);
			let props = ["font-weight", "font-size", "line-height", "font-family"];
			let [weight, size, lh, family] = props.map(name => style.getPropertyValue(name));
			anchor.style.setProperty("font", `${weight} ${size}/${lh} ${family}`);
			let vars = style.getPropertyValue("font-variation-settings");
			if(vars) {
				anchor.style.setProperty("font-variation-settings", vars);
			}
		}
	}

	getAccessibleTextPrefix() {
		// Useful for i18n
		return this.getAttribute(HeadingAnchors.attributes.prefix) || "Jump to section titled";
	}

	getContent() {
		if(this.hasAttribute(HeadingAnchors.attributes.content)) {
			return this.getAttribute(HeadingAnchors.attributes.content);
		}
		return "#";
	}

	// Placeholder nests inside of heading
	getPlaceholderElement() {
		let ph = document.createElement("span");
		ph.setAttribute("aria-hidden", true);
		ph.classList.add(HeadingAnchors.classes.placeholder);
		let content = this.getContent();
		if(content) {
			ph.textContent = content;
		}

		ph.addEventListener("mouseover", (e) => {
			let placeholder = e.target.closest(`.${HeadingAnchors.classes.placeholder}`);
			if(placeholder) {
				this.positionAnchorFromPlaceholder(placeholder);
			}
		});

		return ph;
	}

	getAnchorElement(heading) {
		let anchor = document.createElement("a");
		anchor.href = `#${heading.id}`;
		anchor.classList.add(HeadingAnchors.classes.anchor);

		let content = this.getContent();
		anchor.innerHTML = `<span class="${HeadingAnchors.classes.srOnly}">${this.getAccessibleTextPrefix()}: ${heading.textContent}</span>${content ? `<span aria-hidden="true">${content}</span>` : ""}`;

		anchor.addEventListener("focus", e => {
			let anchor = e.target.closest(`.${HeadingAnchors.classes.anchor}`);
			if(anchor) {
				this.positionAnchor(anchor);
			}
		});

		anchor.addEventListener("mouseover", (e) => {
			// when CSS anchor positioning is supported, this is only used to set the font
			let anchor = e.target.closest(`.${HeadingAnchors.classes.anchor}`);
			this.positionAnchor(anchor);
		});

		return anchor;
	}

	get headings() {
		return this.querySelectorAll(this.selector.split(",").map(entry => `${entry.trim()}[id]`));
	}

	get selector() {
		return this.getAttribute("selector") || HeadingAnchors.defaultSelector;
	}
}

HeadingAnchors.register();

export { HeadingAnchors }