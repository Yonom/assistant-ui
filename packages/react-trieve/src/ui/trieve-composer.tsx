import { Composer } from "@assistant-ui/react";
import { FC } from "react";

const TrieveComposerTagSelector: FC = () => {
  return <div className="aui-trieve-composer-tag-selector">tag1 | tag 2</div>;
};

const TrieveComposer: FC = () => {
  return (
    <Composer.Root>
      <Composer.Attachments />
      <Composer.AddAttachment />
      <Composer.Input autoFocus />
      <Composer.Action />
      <TrieveComposerTagSelector />
    </Composer.Root>
  );
};

const exports = {
  TagSelector: TrieveComposerTagSelector,
};

export default Object.assign(TrieveComposer, exports) as typeof TrieveComposer &
  typeof exports;
