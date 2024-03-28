import { JSDOM } from "jsdom";

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
const SHOW_FLAGS = 0x1 | 0x4;

function findNodesContainingText(document: Document, text: string): Node[] {
  const walker = document.createTreeWalker(document.body, SHOW_FLAGS);
  const nodes: Node[] = [];
  const skip = new Set<Node>([]); // to skip children of found nodes
  while (walker.nextNode()) {
    const current = walker.currentNode.textContent;
    if (!current || skip.has(walker.currentNode)) continue;

    // ignore whitespace or case
    if (equalsLax(current, text)) {
      nodes.push(walker.currentNode);
      walker.currentNode.childNodes.forEach((node) => {
        skip.add(node);
      });
    }
  }
  return nodes;
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

    const similarNodes = [target];

    // Now, for each child of this parent, follow the indices
    siblings.forEach((sibling, i) => {
      // Skip the current node
      if (i === index) return;

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

export function searchSource(src: string, text: string): string[][] {
  const dom = new JSDOM(src);
  const document = dom.window.document;
  const nodes = findNodesContainingText(document, text);

  const similarNodes = nodes.flatMap(findStructurallySimilarNodes);
  const process = (s: string) => {
    return s.replace(/\s+/g, " ").trim();
  };
  return similarNodes.map((nodes) =>
    nodes.map((node) => process(node.textContent!)).filter(Boolean)
  );
}

/*

let path = [];
let current = temp0;
while(current){
  let classes = Array.from(current.classList).join(".");
  if (classes) classes = "." + classes;
    path.push(current.tagName + classes).
  current = current.parentNode;
} 

*/
