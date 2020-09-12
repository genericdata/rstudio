/*
 * insert_citation-source-panel-search-latent.tsx
 *
 * Copyright (C) 2020 by RStudio, PBC
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
import React from "react";

import { EditorUI } from "../../../api/ui";
import { TextInput } from "../../../api/widgets/text";
import { WidgetProps } from "../../../api/widgets/react";

import { CitationSourceList } from "./insert_citation-source-panel-list";
import { TextButton } from "../../../api/widgets/button";
import { CitationListEntry, CitationSourceListStatus, CitationSourceListStatusText } from "./insert_citation-source-panel";

import './insert_citation-source-panel-latent-search.css';
import { execFile } from "child_process";
import { readFile } from "fs/promises";

export interface CitationSourceLatentSearchPanelProps extends WidgetProps {
  height: number;
  citations: CitationListEntry[];
  citationsToAdd: CitationListEntry[];
  searchTerm: string;
  onSearchTermChanged: (searchTerm: string) => void;
  executeSearch: (searchTerm: string) => void;
  selectedIndex: number;
  onSelectedIndexChanged: (index: number) => void;
  onAddCitation: (citation: CitationListEntry) => void;
  onRemoveCitation: (citation: CitationListEntry) => void;
  onConfirm: VoidFunction;
  ui: EditorUI;
  searchPlaceholderText?: string;
  status: CitationSourceListStatus;
  statusText: CitationSourceListStatusText;
}

// TODO: Status / progress issue

const kSearchBoxHeightWithMargin = 38;

export const CitationSourceLatentSearchPanel = React.forwardRef<HTMLDivElement, CitationSourceLatentSearchPanelProps>((props, ref) => {

  const listContainer = React.useRef<HTMLDivElement>(null);
  const pasted = React.useRef<boolean>(false);

  // Search the user search terms
  const searchChanged = (e: React.ChangeEvent<HTMLInputElement>) => {
    const search = e.target.value;
    if (pasted.current) {
      props.executeSearch(search);
      pasted.current = false;
    } else {
      props.onSearchTermChanged(search);
    }
  };

  // If the user arrows down in the search text box, advance to the list of items
  const handleTextKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        event.stopPropagation();
        listContainer.current?.focus();
        break;
      case 'Enter':
        event.preventDefault();
        event.stopPropagation();
        props.executeSearch(props.searchTerm);
        break;
    }
  };

  const handleButtonClick = () => {
    props.executeSearch(props.searchTerm);
  };

  const onPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    pasted.current = true;
  };

  // Used to focus the search box
  const searchBoxRef = React.useRef<HTMLInputElement>(null);

  const focusSearch = () => {
    searchBoxRef.current?.focus();
  };

  // Allow the search box to gain focus the first time the enclosing
  // container div receives focus.
  const initialFocusSet = React.useRef<boolean>(false);
  const parentFocused = () => {
    if (!initialFocusSet.current) {
      focusSearch();
      initialFocusSet.current = true;
    }
  };

  const onAddCitation = (citation: CitationListEntry) => {
    props.onAddCitation(citation);
    focusSearch();
  };

  return (
    <div style={props.style} className='pm-insert-citation-panel-latent-search' ref={ref} tabIndex={-1} onFocus={parentFocused}>
      <div className='pm-insert-citation-panel-latent-search-textbox-container'>
        <TextInput
          value={props.searchTerm}
          width='100%'
          iconAdornment={props.ui.images.search}
          tabIndex={0}
          className='pm-insert-citation-panel-latent-search-textbox pm-block-border-color'
          placeholder={props.searchPlaceholderText}
          onKeyDown={handleTextKeyDown}
          onChange={searchChanged}
          onPaste={onPaste}
          ref={searchBoxRef}
        />

        <TextButton
          title={props.ui.context.translateText('Search')}
          classes={['pm-insert-citation-panel-latent-search-button']}
          onClick={handleButtonClick}
          disabled={props.status === CitationSourceListStatus.inProgress}
        />

      </div>

      <div className='pm-insert-citation-panel-latent-search-list-container'>
        <CitationSourceList
          height={props.height - kSearchBoxHeightWithMargin}
          citations={props.citations}
          citationsToAdd={props.citationsToAdd}
          onAddCitation={onAddCitation}
          onRemoveCitation={props.onRemoveCitation}
          selectedIndex={props.selectedIndex}
          onSelectedIndexChanged={props.onSelectedIndexChanged}
          focusPrevious={focusSearch}
          onConfirm={props.onConfirm}
          ui={props.ui}
          status={props.status}
          statusText={props.statusText}
          classes={['pm-insert-citation-panel-latent-search-list', 'pm-block-border-color', 'pm-background-color']}
          ref={listContainer}
        />
      </div>

    </div>);
});

