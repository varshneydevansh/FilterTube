---------------------------- MODULE DeviceSync ----------------------------
EXTENDS Naturals, FiniteSets, TLC

\* A finite authorization model, not an implementation of encryption or discovery.
\* P and Q are receiver-local parents; the remote signer has a separate identity.
\* A receive-only child may approve nothing, but its parent may approve while it
\* remains active. This is deliberately different from a child sending policies.
CONSTANTS FreshApplyGuard, FreshReceiptGuard, PairGuard

VARIABLES env, link, op, delivery, evidence
vars == <<env, link, op, delivery, evidence>>

Scopes == {"main", "kids"}
Actors == {"P", "Q", "master", "child"}
ReceiverCanRequest(a, owner) == a \in {owner, "master", "child"}
NoOp == [stage |-> "idle", kind |-> "none", rev |-> 0,
         actor |-> "P", owner |-> "P", sender |-> "P",
         target |-> "child", scope |-> "main"]

Init == /\ env = [sender |-> "P", actor |-> "P", owner |-> "P",
                  nearby |-> FALSE]
        /\ link = [phase |-> "none", trusted |-> FALSE, revoked |-> FALSE,
                   owner |-> "P", actor |-> "P"]
        /\ op = NoOp
        /\ delivery = [sent |-> 0, applied |-> 0, receipts |-> {},
                       ack |-> 0, shownApplied |-> FALSE]
        /\ evidence = [badWrite |-> FALSE, childSend |-> FALSE,
                       trustLeak |-> FALSE]

Discover == /\ ~env.nearby
            /\ env' = [env EXCEPT !.nearby = TRUE]
            /\ UNCHANGED <<link, op, delivery, evidence>>

ChangeSender == /\ env' = [env EXCEPT !.sender =
                                   IF @ = "P" THEN "child" ELSE "P"]
                /\ UNCHANGED <<link, op, delivery, evidence>>
ChangeActor(a) == /\ a \in Actors /\ a # env.actor
                  /\ env' = [env EXCEPT !.actor = a]
                  /\ UNCHANGED <<link, op, delivery, evidence>>
ChangeOwner == /\ env' = [env EXCEPT !.owner = IF @ = "P" THEN "Q" ELSE "P"]
               /\ UNCHANGED <<link, op, delivery, evidence>>

OfferPair == /\ link.phase = "none" /\ env.sender = "P"
             /\ ReceiverCanRequest(env.actor, env.owner)
             /\ link' = [link EXCEPT !.phase = "offered",
                            !.owner = env.owner, !.actor = env.actor]
             /\ UNCHANGED <<env, op, delivery, evidence>>
MatchPhrase == /\ link.phase = "offered"
               /\ link' = [link EXCEPT !.phase = "matched"]
               /\ UNCHANGED <<env, op, delivery, evidence>>
SaveTrust == /\ IF PairGuard THEN link.phase = "matched"
                            ELSE link.phase \in {"offered", "matched"}
             /\ env.owner = link.owner /\ env.actor = link.actor
             /\ env.sender = "P" /\ ~link.revoked
             /\ link' = [link EXCEPT !.trusted = TRUE, !.phase = "trusted"]
             /\ evidence' = [evidence EXCEPT
                              !.trustLeak = @ \/ link.phase # "matched"]
             /\ UNCHANGED <<env, op, delivery>>
Revoke == /\ link.trusted /\ ~link.revoked
          /\ link' = [link EXCEPT !.revoked = TRUE]
          /\ UNCHANGED <<env, op, delivery, evidence>>

\* Capture a proposed immutable operation before any asynchronous approval.
\* Invalid target/scope proposals are included to exercise the guards.
Begin(kind, target, scope) ==
    /\ op.stage = "idle" /\ delivery.sent < 2
    /\ kind \in {"managed", "once"}
    /\ target \in {"child", "other"} /\ scope \in Scopes \cup {"other"}
    /\ op' = [stage |-> "approving", kind |-> kind,
               rev |-> delivery.sent + 1, actor |-> env.actor,
               owner |-> env.owner, sender |-> env.sender,
               target |-> target, scope |-> scope]
    /\ UNCHANGED <<env, link, delivery, evidence>>

Approve == /\ op.stage = "approving"
           /\ op.actor = env.actor /\ op.owner = env.owner
           /\ ReceiverCanRequest(env.actor, env.owner)
           /\ op.target = "child" /\ op.scope \in Scopes
           /\ (op.kind = "once" \/
               (link.trusted /\ ~link.revoked /\ op.sender = "P"
                /\ env.sender = op.sender /\ link.owner = env.owner))
           /\ op' = [op EXCEPT !.stage = "ready"]
           /\ UNCHANGED <<env, link, delivery, evidence>>

Send == /\ op.stage = "ready"
        /\ (op.kind = "once" \/ (env.sender = op.sender /\ op.sender = "P"))
        /\ op' = [op EXCEPT !.stage = "inflight"]
        /\ delivery' = [delivery EXCEPT !.sent = op.rev,
                                         !.shownApplied = FALSE]
        /\ evidence' = [evidence EXCEPT !.childSend =
                         @ \/ (op.kind = "managed" /\ op.sender = "child")]
        /\ UNCHANGED <<env, link>>

FreshAuthority ==
    /\ op.target = "child" /\ op.scope \in Scopes
    /\ IF op.kind = "once"
          THEN /\ env.owner = op.owner /\ env.actor = op.actor
               /\ ReceiverCanRequest(env.actor, env.owner)
          ELSE /\ link.trusted /\ ~link.revoked
               /\ env.owner = link.owner /\ op.sender = "P"

Apply == /\ op.stage = "inflight" /\ op.rev > delivery.applied
         /\ (~FreshApplyGuard \/ FreshAuthority)
         /\ op' = [op EXCEPT !.stage = "done"]
         /\ delivery' = [delivery EXCEPT !.applied = op.rev,
                                          !.receipts = @ \cup {op.rev}]
         /\ evidence' = [evidence EXCEPT !.badWrite = @ \/ ~FreshAuthority]
         /\ UNCHANGED <<env, link>>

\* Receipt arrival may be delayed/reordered. Each represented receipt is assumed
\* authentic and scoped to this one link/device/target/scope stream.
ReceiveReceipt(r) ==
    /\ r \in delivery.receipts
    /\ delivery' = [delivery EXCEPT !.ack = r,
        !.shownApplied = IF FreshReceiptGuard THEN r = delivery.sent ELSE TRUE]
    /\ UNCHANGED <<env, link, op, evidence>>

Reset == /\ op.stage \in {"approving", "ready", "inflight", "done"}
         /\ op' = NoOp
         /\ UNCHANGED <<env, link, delivery, evidence>>

Next == Discover \/ ChangeSender \/ ChangeOwner
        \/ (\E a \in Actors : ChangeActor(a))
        \/ OfferPair \/ MatchPhrase \/ SaveTrust \/ Revoke
        \/ (\E kind \in {"managed", "once"},
                target \in {"child", "other"},
                scope \in Scopes \cup {"other"} : Begin(kind, target, scope))
        \/ Approve \/ Send \/ Apply \/ Reset
        \/ (\E r \in {1, 2} : ReceiveReceipt(r))

Spec == Init /\ [][Next]_vars

TypeOK == /\ env.sender \in {"P", "child"} /\ env.actor \in Actors
          /\ env.owner \in {"P", "Q"} /\ env.nearby \in BOOLEAN
          /\ link.phase \in {"none", "offered", "matched", "trusted"}
          /\ link.trusted \in BOOLEAN /\ link.revoked \in BOOLEAN
          /\ op.stage \in {"idle", "approving", "ready", "inflight", "done"}
          /\ op.rev \in 0..2
          /\ delivery.sent \in 0..2 /\ delivery.applied \in 0..2
          /\ delivery.receipts \subseteq {1, 2}
FreshWriteAuthority == ~evidence.badWrite
NoChildManagedSend == ~evidence.childSend
PresenceIsNotTrust == ~evidence.trustLeak
AppliedMeansLatest == delivery.shownApplied =>
                      /\ delivery.sent > 0
                      /\ delivery.ack = delivery.sent
                      /\ delivery.applied >= delivery.sent
ReceiptFollowsApply == \A r \in delivery.receipts : r <= delivery.applied

=============================================================================
