declare namespace google.accounts.id {
  interface CredentialResponse {
    credential: string;
  }
  interface IdConfiguration {
    client_id: string;
    callback: (res: CredentialResponse) => void;
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
  }
  function initialize(config: IdConfiguration): void;
  function renderButton(
    parent: HTMLElement,
    options: { theme?: string; size?: string; width?: number; text?: string; shape?: string; logo_alignment?: string }
  ): void;
  function prompt(momentListener?: (moment: string) => void): void;
  function disableAutoSelect(): void;
  function storeCredential(credential: string, callback: () => void): void;
  function cancel(): void;
  function revoke(credential: string, callback?: () => void): void;
}

interface Window {
  google?: {
    accounts: {
      id: typeof google.accounts.id;
      oauth2: {
        initCodeClient(config: {
          client_id: string;
          scope: string;
          callback: (res: { code: string }) => void;
        }): {
          requestCode: () => void;
        };
      };
    };
  };
}
