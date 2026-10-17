-------------------------- MODULE ProfileBinding --------------------------
EXTENDS Naturals, TLC

\* Orthogonal finite model: a device has two parents and two child profiles.
\* A picker may change while approval/signing is pending. The approved recipient
\* and source must remain operation-local; an unrelated child must never change.
CONSTANT FixedSnapshot
VARIABLES owners, picker, operation, writes, contaminated
vars == <<owners, picker, operation, writes, contaminated>>
Children == {"childA", "childB"}
Parents == {"parentA", "parentB"}
Init == /\ owners = [childA |-> "parentA", childB |-> "parentB"]
        /\ picker = [target |-> "childA", source |-> "parentA"]
        /\ operation = [stage |-> "idle", target |-> "childA",
                         source |-> "parentA", owner |-> "parentA"]
        /\ writes = [childA |-> 0, childB |-> 0]
        /\ contaminated = FALSE

Select(t, s) == /\ t \in Children /\ s \in Parents
                /\ picker' = [target |-> t, source |-> s]
                /\ UNCHANGED <<owners, operation, writes, contaminated>>
Reparent(t, p) == /\ t \in Children /\ p \in Parents
                  /\ owners' = [owners EXCEPT ![t] = p]
                  /\ UNCHANGED <<picker, operation, writes, contaminated>>
Begin == /\ operation.stage = "idle"
         /\ operation' = [stage |-> "awaiting", target |-> picker.target,
                          source |-> picker.source, owner |-> owners[picker.target]]
         /\ UNCHANGED <<owners, picker, writes, contaminated>>
Approve == /\ operation.stage = "awaiting"
           /\ operation.source = operation.owner
           /\ owners[operation.target] = operation.owner
           /\ operation' = [operation EXCEPT !.stage = "approved"]
           /\ UNCHANGED <<owners, picker, writes, contaminated>>
Write == LET target == IF FixedSnapshot THEN operation.target ELSE picker.target
             source == IF FixedSnapshot THEN operation.source ELSE picker.source
         IN /\ operation.stage = "approved"
            /\ owners[operation.target] = operation.owner
            /\ writes[target] = 0
            /\ writes' = [writes EXCEPT ![target] = 1]
            /\ contaminated' = (contaminated \/ target # operation.target
                                                \/ source # operation.source)
            /\ operation' = [operation EXCEPT !.stage = "done"]
            /\ UNCHANGED <<owners, picker>>
Reset == /\ operation.stage # "idle"
         /\ operation' = [operation EXCEPT !.stage = "idle"]
         /\ UNCHANGED <<owners, picker, writes, contaminated>>
Next == (\E t \in Children, s \in Parents : Select(t, s))
        \/ (\E t \in Children, p \in Parents : Reparent(t, p))
        \/ Begin \/ Approve \/ Write \/ Reset
Spec == Init /\ [][Next]_vars
TypeOK == /\ owners \in [Children -> Parents]
          /\ writes \in [Children -> 0..1]
          /\ picker.target \in Children /\ picker.source \in Parents
          /\ operation.target \in Children /\ operation.source \in Parents
          /\ operation.owner \in Parents /\ contaminated \in BOOLEAN
NoCrossProfileWrite == ~contaminated
=============================================================================
