
import json
from django.contrib.auth import authenticate, login, logout
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from django.shortcuts import render
from .models import User, Email

@login_required
def index(request):
    return render(request, "mail/inbox.html")

@login_required
def mailbox(request, mailbox):
    user = request.user
    if mailbox == "inbox":
        emails = Email.objects.filter(recipients=user, archived=False)
    elif mailbox == "sent":
        emails = Email.objects.filter(sender=user)
    elif mailbox == "archive":
        emails = Email.objects.filter(recipients=user, archived=True)
    else:
        return JsonResponse({"error": "Invalid mailbox."}, status=400)

    return JsonResponse([{
        "id": email.id,
        "sender": email.sender.username,
        "recipients": [r.username for r in email.recipients.all()],
        "subject": email.subject,
        "body": email.body,
        "timestamp": email.timestamp.strftime("%b %d %Y, %I:%M %p"),
        "read": email.read
    } for email in emails], safe=False)

@login_required
def email_detail(request, email_id):
    try:
        email = Email.objects.get(pk=email_id)
        if request.user != email.sender and request.user not in email.recipients.all():
            return JsonResponse({"error": "Access denied."}, status=403)
        return JsonResponse({
            "id": email.id,
            "sender": email.sender.username,
            "recipients": [r.username for r in email.recipients.all()],
            "subject": email.subject,
            "body": email.body,
            "timestamp": email.timestamp.strftime("%b %d %Y, %I:%M %p"),
            "read": email.read,
            "archived": email.archived
        })
    except Email.DoesNotExist:
        return JsonResponse({"error": "Email not found."}, status=404)

@csrf_exempt
@login_required
def send_email(request):
    data = json.loads(request.body)
    recipients = [u.strip() for u in data.get("recipients").split(",")]
    subject = data.get("subject", "")
    body = data.get("body", "")

    sender = request.user
    email = Email.objects.create(user=sender, sender=sender, subject=subject, body=body)

    for username in recipients:
        try:
            recipient = User.objects.get(username=username)
            email.recipients.add(recipient)
        except User.DoesNotExist:
            return JsonResponse({"error": f"User '{username}' does not exist."}, status=400)

    email.save()
    return JsonResponse({"message": "Email sent successfully."}, status=201)

@csrf_exempt
@login_required
def update_email(request, email_id):
    try:
        email = Email.objects.get(pk=email_id)
        data = json.loads(request.body)
        if "read" in data:
            email.read = data["read"]
        if "archived" in data:
            email.archived = data["archived"]
        email.save()
        return JsonResponse({"message": "Email updated."})
    except Email.DoesNotExist:
        return JsonResponse({"error": "Email not found."}, status=404)
