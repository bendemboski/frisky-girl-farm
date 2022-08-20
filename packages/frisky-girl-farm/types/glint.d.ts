import '@glint/environment-ember-loose';

import EqHelper from '@gavant/glint-template-types/types/ember-truth-helpers/eq';
import NotHelper from '@gavant/glint-template-types/types/ember-truth-helpers/not';
import PerformHelper from '@gavant/glint-template-types/types/ember-concurrency/perform';
import FaIconHelper from '@gavant/glint-template-types/types/@fortawesome/ember-fontawesome/helpers/fa-icon';
import OnClickOutsideModifier from '@gavant/glint-template-types/types/ember-click-outside/modifier';
import ModalDialog from '@gavant/glint-template-types/types/ember-modal-dialog/modal-dialog';

import { ComponentLike } from '@glint/template';

declare module '@glint/environment-ember-loose/registry' {
  export default interface Registry {
    eq: typeof EqHelper;
    not: typeof NotHelper;
    sub: HelperLike<{
      Args: { Positional: [number, number] };
      Return: number;
    }>;
    mult: HelperLike<{
      Args: { Positional: [number, number] };
      Return: number;
    }>;
    perform: typeof PerformHelper;
    FaIcon: typeof FaIconHelper;
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
                  }
                ];
              };
            }>;
          }
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
          }
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
