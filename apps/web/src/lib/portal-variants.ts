/** `/office` UI: school `StaffRole.ADMIN` → admin chrome; everyone else → staff chrome. */
export type OfficePortalVariant = 'staff' | 'admin'

/** Which app shell layout is active (drives TopBar / sidebar). */
export type AppPortal = 'owner' | 'admin' | 'teacher' | 'superadmin'
