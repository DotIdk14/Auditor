declare namespace google.accounts.id {
  interface CredentialResponse {
    credential: string;
  }
  interface IdConfiguration {
    client_id: string;
    callback: (res: CredentialResponse) => void;
  }
  function initialize(config: IdConfiguration): void;
  function renderButton(
    parent: HTMLElement,
    options: { theme?: string; size?: string; width?: number; text?: string; shape?: string }
  ): void;
}

interface Window {
  google?: {
    accounts: {
      id: typeof google.accounts.id;
    };
  };
}
