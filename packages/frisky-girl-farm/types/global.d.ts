import '@glint/environment-ember-loose';

import EqHelper from 'ember-truth-helpers/helpers/eq';
import GtHelper from 'ember-truth-helpers/helpers/gt';
import NotHelper from 'ember-truth-helpers/helpers/not';
import OrHelper from 'ember-truth-helpers/helpers/or';
import PerformHelper from 'ember-concurrency/helpers/perform';
import OnDocumentHelper from 'ember-on-helper/helpers/on-document';
import FaIcon from '@fortawesome/ember-fontawesome/components/fa-icon';
import OnClickOutsideModifier from 'ember-click-outside/modifiers/on-click-outside';
import ModalDialog from 'ember-modal-dialog/components/modal-dialog';

import { ComponentLike, HelperLike } from '@glint/template';

declare module '@glint/environment-ember-loose/registry' {
  export default interface Registry {
    eq: typeof EqHelper;
    gt: typeof GtHelper;
    not: typeof NotHelper;
    or: typeof OrHelper;
    sub: HelperLike<{
      Args: { Positional: [number, number] };
      Return: number;
    }>;
    mult: HelperLike<{
      Args: { Positional: [number, number] };
      Return: number;
    }>;
    perform: typeof PerformHelper;
    'on-document': typeof OnDocumentHelper;
    FaIcon: typeof FaIcon;
    'on-click-outside': typeof OnClickOutsideModifier;
    BsNavbar: ComponentLike<{
      Element: HTMLElement;
      Args: {
        position: 'fixed-top';
      };
      Blocks: {
        default: [
          {
            toggle: ComponentLike;
            content: ComponentLike<{ Blocks: { default: [] } }>;
            nav: ComponentLike<{
              Element: HTMLElement;
              Blocks: {
                default: [
                  {
                    item: ComponentLike<{ Blocks: { default: [] } }>;
                  },
                ];
              };
            }>;
          },
        ];
      };
    }>;
    BsForm: ComponentLike<{
      Element: HTMLFormElement;
      Args: {
        model: unknown;
        onSubmit: () => void;
      };
      Blocks: {
        default: [
          {
            group: ComponentLike<{
              Element: HTMLDivElement;
              Blocks: { default: [] };
            }>;
            element: ComponentLike<{
              Element: HTMLInputElement;
              Args: {
                controlType: 'text' | 'number' | 'email';
                label: string;
                property: string;
                customError?: string;
              };
              Blocks: { default: [] };
            }>;
            submitButton: ComponentLike<{
              Element: HTMLButtonElement;
              Blocks: { default: [] };
            }>;
            isSubmitting: boolean;
          },
        ];
      };
    }>;
    BsButton: ComponentLike<{
      Element: HTMLButtonElement;
      Args: {
        type: 'secondary';
        onClick: () => void;
      };
      Blocks: {
        default: [];
      };
    }>;
    BsPopover: ComponentLike<{
      Element: HTMLDivElement;
      Args: {
        placement: 'bottom';
        onShow: () => void;
        onHide: () => void;
      };
      Blocks: { default: [{ close: () => void }] };
    }>;
    BsCollapse: ComponentLike<{
      Args: { collapsed: boolean };
      Blocks: { default: [] };
    }>;
    ModalDialog: typeof ModalDialog;
  }
}
