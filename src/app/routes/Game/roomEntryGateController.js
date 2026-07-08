export class RoomEntryGateError extends Error {
  constructor(message = 'Profile confirmation is required.') {
    super(message);
    this.name = 'RoomEntryGateError';
    this.code = 'profile_confirmation_required';
  }
}

export function createRoomEntryGateController({ getAuthToken }) {
  let pendingEntry = null;

  return {
    confirm({ onConfirmed, persistProfile }) {
      if (!pendingEntry) {
        pendingEntry = (async () => {
          const savedProfile = await persistProfile();
          const token = savedProfile?.token || getAuthToken();

          if (!token) throw new RoomEntryGateError();

          await onConfirmed({ savedProfile, token });
          return { savedProfile, token };
        })().finally(() => {
          pendingEntry = null;
        });
      }

      return pendingEntry;
    },
  };
}
