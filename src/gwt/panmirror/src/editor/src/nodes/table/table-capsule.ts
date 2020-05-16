
/*
 * table-capsule.ts
 *
 * Copyright (C) 2019-20 by RStudio, PBC
 *
 * Unless you have received this program directly from RStudio pursuant
 * to the terms of a commercial license agreement with RStudio, then
 * this program is licensed to you under the terms of version 3 of the
 * GNU Affero General Public License. This program is distributed WITHOUT
 * ANY EXPRESS OR IMPLIED WARRANTY, INCLUDING THOSE OF NON-INFRINGEMENT,
 * MERCHANTABILITY OR FITNESS FOR A PARTICULAR PURPOSE. Please refer to the
 * AGPL (http://www.gnu.org/licenses/agpl-3.0.txt) for more details.
 *
 */

import { Schema, DOMParser } from "prosemirror-model";


import { PandocBlockCapsuleFilter, PandocBlockCapsule, blockCapsuleParagraphTokenHandler, encodedBlockCapsuleRegex, blockCapsuleTextHandler, blockCapsuleSourceWithoutPrefix } from "../../api/pandoc_capsule";
import { ProsemirrorWriter } from "../../api/pandoc";
import { kHTMLFormat } from "../../api/raw";

export function tableBlockCapsuleFilter() : PandocBlockCapsuleFilter {

  const kTableBlockCapsuleType = '8EF5A772-DD63-4622-84BF-AF1995A1B2B9'.toLowerCase();

  return {

    type: kTableBlockCapsuleType,
    
    match: /^([\t >]*)(<table>.*?<\/table>)([ \t]*)$/gm,
    
    // textually enclose the capsule so that pandoc parses it as the type of block we want it to
    // (in this case we don't do anything because pandoc would have written this table as a 
    // semantically standalone block)
    enclose: (capsuleText: string, capsule: PandocBlockCapsule) => {
      return capsuleText;
    },

    // look for one of our block capsules within pandoc ast text (e.g. a code or raw block)
    // and if we find it, parse and return the original source code
    handleText: blockCapsuleTextHandler(
      kTableBlockCapsuleType, 
      encodedBlockCapsuleRegex(undefined, undefined, 'gm'),
    ),
  
    // we are looking for a paragraph token consisting entirely of a block capsule of our type. 
    // if find that then return the block capsule text
    handleToken: blockCapsuleParagraphTokenHandler(kTableBlockCapsuleType),

    // write the node as a table (parse the html)
    writeNode: (schema: Schema, writer: ProsemirrorWriter, capsule: PandocBlockCapsule) => {

      // remove the source prefix
      const source = blockCapsuleSourceWithoutPrefix(capsule.source, capsule.prefix)

      // fallback to write as raw html
      const writeAsRawHTML = () => {
        writer.openNode(schema.nodes.raw_block, {format: kHTMLFormat });
        writer.writeText(source);
        writer.closeNode();
      };

      // parse the table from the string
      const parser = new window.DOMParser();
      const doc = parser.parseFromString(capsule.source, 'text/html');
      if (doc.body && doc.body.firstChild instanceof HTMLTableElement) {

        // parse the prosemirror table element
        const prosemirrorDomParser = DOMParser.fromSchema(schema);
        const slice = prosemirrorDomParser.parseSlice(doc.body);
        if (slice.content.firstChild && slice.content.firstChild.type === schema.nodes.table) {

          // TODO: test yaml metadata to make sure it still works as expected
          // TODO: fixup all of the cells / alignment / colpercents (this is just like a paste)

          writer.addNode(schema.nodes.table_container, {}, [slice.content.firstChild]);
        } else {
          writeAsRawHTML();
        }
      
      // fallback to writing as raw_html (round-trip unmodified)
      } else {
        writeAsRawHTML();
      }
    }
  };
}
