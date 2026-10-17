-------------------------- MODULE IssueSafety --------------------------
EXTENDS Integers, TLC
CONSTANTS UnsafeInit, UnsafeExport
VARIABLES revision, authority, captured, initPhase, reviewedRevision,
          reviewedAuthority, badInit, badExport
vars == <<revision, authority, captured, initPhase, reviewedRevision,
          reviewedAuthority, badInit, badExport>>
Init == /\ revision = 0 /\ authority = 0 /\ captured = -1
        /\ initPhase = "idle" /\ reviewedRevision = -1
        /\ reviewedAuthority = -1 /\ badInit = FALSE /\ badExport = FALSE
PublishSettings == /\ revision < 2 /\ revision' = revision + 1
                   /\ UNCHANGED <<authority, captured, initPhase, reviewedRevision,
                                  reviewedAuthority, badInit, badExport>>
ChangeAuthority == /\ authority < 2 /\ authority' = authority + 1
                   /\ UNCHANGED <<revision, captured, initPhase, reviewedRevision,
                                  reviewedAuthority, badInit, badExport>>
BeginInit == /\ initPhase = "idle" /\ captured' = revision
             /\ initPhase' = "waiting"
             /\ UNCHANGED <<revision, authority, reviewedRevision, reviewedAuthority,
                            badInit, badExport>>
FinishInit == /\ initPhase = "waiting" /\ initPhase' = "done"
              /\ badInit' = (badInit \/ ((IF UnsafeInit THEN captured ELSE revision) # revision))
              /\ UNCHANGED <<revision, authority, captured, reviewedRevision,
                             reviewedAuthority, badExport>>
Review == /\ reviewedRevision = -1
          /\ reviewedRevision' = revision /\ reviewedAuthority' = authority
          /\ UNCHANGED <<revision, authority, captured, initPhase, badInit, badExport>>
ConfirmExport == /\ reviewedRevision >= 0
                 /\ (UnsafeExport \/ (reviewedRevision = revision /\ reviewedAuthority = authority))
                 /\ badExport' = (badExport \/ reviewedRevision # revision \/ reviewedAuthority # authority)
                 /\ UNCHANGED <<revision, authority, captured, initPhase, reviewedRevision,
                                reviewedAuthority, badInit>>
Next == PublishSettings \/ ChangeAuthority \/ BeginInit \/ FinishInit \/ Review \/ ConfirmExport
Spec == Init /\ [][Next]_vars
FreshInitialization == ~badInit
FreshExportReview == ~badExport
=============================================================================
