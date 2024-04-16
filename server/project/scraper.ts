import { JSDOM } from "jsdom";

const process = (s: string) => {
  return s.replace(/\s+/g, " ").trim();
};

function makeLax(text: string): string {
  return text.toLowerCase().replace(/\s/g, "");
}

function includesLax(text: string, search: string): boolean {
  return makeLax(text).includes(makeLax(search));
}

function equalsLax(text: string, search: string): boolean {
  return makeLax(text) === makeLax(search);
}

// See https://developer.mozilla.org/en-US/docs/Web/API/Document/createTreeWalker
// Element and Text nodes.
const SHOW_ELEMENT_TEXT = 0x1 | 0x4;
const SHOW_ELEMENT = 0x1;

function findNodesContainingText(
  document: Document,
  text: string,
  inner = true
): Node[] {
  const walker = document.createTreeWalker(document.body, SHOW_ELEMENT_TEXT);
  const nodes: Set<Node> = new Set<Node>();
  if (!inner) {
    const skip = new Set<Node>([]); // to skip children of found nodes
    while (walker.nextNode()) {
      const current = walker.currentNode.textContent;
      if (!current || skip.has(walker.currentNode)) continue;
      const parent = walker.currentNode.parentNode;
      if (parent && skip.has(parent)) {
        skip.add(walker.currentNode);
        continue;
      }
      // ignore whitespace or case
      if (equalsLax(current, text)) {
        nodes.add(walker.currentNode);
        walker.currentNode.childNodes.forEach((node) => {
          skip.add(node);
        });
      }
    }
  } else {
    while (walker.nextNode()) {
      const current = walker.currentNode.textContent;
      if (!current) continue;
      const parent = walker.currentNode.parentNode;
      if (includesLax(current, text)) {
        if (parent && nodes.has(parent)) {
          nodes.delete(parent);
        }
        nodes.add(walker.currentNode);
      }
    }
  }

  return Array.from(nodes);
}

function findStructurallySimilarNodes(target: Node): Array<Node[]> {
  const similarities: Array<Node[]> = [];

  // Sometimes there's unnecessary chaining of nodes, this flag is to hit first non-useless node
  let hasNormalized = false;
  let current = target;

  const path: { index: number; name: string }[] = [];

  while (current.parentNode) {
    const parent = current.parentNode;
    const siblings = Array.from(parent.childNodes);
    const index = siblings.indexOf(current as ChildNode);
    const name = current.nodeName;

    // Special case, for first parent with multiple children, add it to the list
    if (!hasNormalized && siblings.length > 1) {
      similarities.push(siblings);
      hasNormalized = true;
    }

    const similarNodes: Node[] = [];

    // Now, for each child of this parent, follow the indices
    siblings.forEach((sibling, i) => {
      // Skip the current node
      if (i === index) {
        similarNodes.push(target);
        return;
      }

      // Heuristic: If the sibling is not the same type as the current node, skip
      if (sibling.nodeName !== current.nodeName) return;

      let searchNode: ChildNode = sibling;
      for (const { index, name } of path) {
        if (searchNode.childNodes.length <= index) {
          return;
        }

        searchNode = searchNode.childNodes[index];
        // Heuristic: If the node name doesn't match in the path, skip
        if (searchNode.nodeName !== name) {
          return;
        }
      }

      // Heuristic: check name and number of children, but this needs to be improved
      if (
        searchNode.nodeName !== target.nodeName ||
        searchNode.childNodes.length !== target.childNodes.length
      ) {
        return;
      }

      // If we reached here, we found a match
      similarNodes.push(searchNode);
    });

    if (similarNodes.length > 1) {
      similarities.push(similarNodes);
    }

    // Add current node to the beginning of the path
    path.unshift({ index, name });

    current = parent;
  }

  return similarities;
}

function escapePseudoClasses(classList: DOMTokenList): Array<string> {
  const escapedClasses: Array<string> = [];

  classList.forEach((className) => {
    escapedClasses.push(className.replace(/:/g, "\\:"));
  });

  return escapedClasses;
}

function getCSSPath(target: Node, includeIds = false): string {
  let path: Array<string> = [];
  let current = target;

  while (current) {
    let currentNode = current.nodeName.toLowerCase();
    if (current.nodeType == SHOW_ELEMENT) {
      const currentElement = current as Element;

      const id = currentElement.id;
      if (includeIds && id) {
        currentNode += "#" + id;
      }

      const classes = escapePseudoClasses(currentElement.classList).join(".");
      if (classes) {
        currentNode += "." + classes;
      }

      path.unshift(currentNode);
    }

    if (current.parentNode && current.nodeName.toLowerCase() !== "html") {
      current = current.parentNode;
    } else {
      break;
    }
  }

  return path.join(" ");
}

export function getNodesWithSimilarCSSPath(
  src: string,
  fullCssPath: string
): Array<Node> {
  const cssPath = fullCssPath.split(" ");
  const cssPathString = cssPath
    .join(" ")
    .replace(/html\.[^\s]+/, "html")
    .replace(/body\.[^\s]+/, "body");

  const dom = new JSDOM(src);
  const document = dom.window.document;
  return Array.from(document.querySelectorAll(cssPathString));
}

export function searchSource(src: string, text: string) {
  const dom = new JSDOM(src);
  const document = dom.window.document;
  const nodes = findNodesContainingText(document, text);

  const results = [];

  for (const node of nodes) {
    const similarNodes = findStructurallySimilarNodes(node);
    const cssPath = getCSSPath(node);
    if (similarNodes.length) {
      results.push({ similarNodes, cssPath });
    }
  }

  return results;
}

export function searchCssPaths(src: string, text: string) {
  const dom = new JSDOM(src);
  const document = dom.window.document;
  const nodes = findNodesContainingText(document, text);
  return nodes.map((node) => getCSSPath(node));
}

export function getAllLinks(src: string, baseURI: string, pattern: string) {
  const dom = new JSDOM(src);
  const document = dom.window.document;
  const links = document.querySelectorAll("a");
  const matches = [];
  for (const link of links) {
    const fullUrl = new URL(link.href, baseURI).href;
    if (fullUrl.match(new RegExp(pattern))) {
      matches.push(fullUrl);
    }
  }
  return matches;
}
